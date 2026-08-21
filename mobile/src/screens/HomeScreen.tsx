import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { healthCheck, getLessons, getProgress } from '../services/api';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Chargement...');
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [health, lessonData, progressData] = await Promise.all([healthCheck(), getLessons(), getProgress()]);
        setStatus(health?.status || 'ok');
        setLessons(Array.isArray(lessonData) ? lessonData : []);
        setProgress(Array.isArray(progressData) ? progressData : []);
      } catch (error) {
        setStatus('API indisponible');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MǍA-KWƐ́LÎ</Text>
          <Text style={styles.title}>Bienvenue dans la version mobile</Text>
          <Text style={styles.subtitle}>Le frontend est maintenant branché sur une API autonome FastAPI.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>État de l’API</Text>
          {loading ? <ActivityIndicator color="#f59e0b" /> : <Text style={styles.panelValue}>{status}</Text>}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Leçons</Text>
          {lessons.map((lesson) => (
            <View key={lesson.id} style={styles.row}>
              <Text style={styles.rowTitle}>{lesson.title}</Text>
              <Text style={styles.rowSubtitle}>Leçon {lesson.lesson_number}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Progression</Text>
          {progress.map((item, index) => (
            <View key={`${item.language_code}-${index}`} style={styles.row}>
              <Text style={styles.rowTitle}>{item.language_code}</Text>
              <Text style={styles.rowSubtitle}>XP {item.xp} · streak {item.streak}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: '#111827', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  eyebrow: { fontSize: 12, letterSpacing: 2, color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#cbd5e1', marginTop: 8, lineHeight: 22 },
  panel: { backgroundColor: '#111827', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  panelTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  panelValue: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },
  row: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1f2937' },
  rowTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  rowSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
});
