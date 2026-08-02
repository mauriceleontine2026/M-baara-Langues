import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export default function Button({onPress, title}:{onPress:()=>void; title:string}){
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.txt}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#0ea5a3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  txt: {
    color: '#fff',
    fontWeight: '600'
  }
})
