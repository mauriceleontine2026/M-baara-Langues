import React, { useState, useRef } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { synthesizeAudio, transcribeAudio } from '../services/api';

export default function AudioScreen() {
  const [text, setText] = useState('Bonjour Mbaara');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function handleSynthesize() {
    setLoading(true);
    try {
      // Speak locally via expo-speech first
      Speech.speak(text, { language: 'fr' });

      // Also request server TTS (optional)
      const data = await synthesizeAudio(text, 'fr');
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Erreur de synthèse vocale');
    } finally {
      setLoading(false);
    }
  }

  async function handleTranscribe() {
    setLoading(true);
    try {
      const formData = new FormData();
      // Placeholder: send a sample file or instruct user to record
      formData.append('file', {
        uri: 'https://example.com/audio.mp3',
        name: 'audio.mp3',
        type: 'audio/mpeg',
      } as any);
      const data = await transcribeAudio(formData);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Erreur de transcription');
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setResult('Permission microphone refusée');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setRecording(rec);
      setResult('Enregistrement en cours...');
    } catch (err) {
      setResult('Erreur démarrage enregistrement');
    }
  }

  async function stopRecordingAndSend() {
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setRecording(null);
      recordingRef.current = null;
      if (!uri) {
        setResult('Aucune donnée audio');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'recording.wav';
      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/wav';
      formData.append('file', { uri, name: filename, type: mimeType } as any);
      const data = await transcribeAudio(formData);
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult('Erreur envoi enregistrement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Audio IA</Text>
        <Text style={styles.subtitle}>Préparation des endpoints de transcription et synthèse.</Text>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Texte à synthétiser" />
        <View style={styles.actions}>
          <Button title={loading ? 'Traitement...' : 'Synthétiser (local)'} onPress={handleSynthesize} />
          <Button title="Transcrire (placeholder)" onPress={handleTranscribe} />
          {!recording ? (
            <Button title="Démarrer enregistrement" onPress={startRecording} />
          ) : (
            <Button title="Arrêter et envoyer" onPress={stopRecordingAndSend} />
          )}
        </View>
        <View style={styles.resultBox}><Text style={styles.result}>{result}</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, marginBottom: 16 },
  input: { backgroundColor: '#111827', color: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  actions: { gap: 10, marginTop: 16 },
  resultBox: { marginTop: 20, backgroundColor: '#111827', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' },
  result: { color: '#cbd5e1', fontSize: 13 },
});
