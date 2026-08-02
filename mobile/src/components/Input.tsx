import { TextInput, StyleSheet } from 'react-native'

export default function Input(props:{value:string; onChangeText:(t:string)=>void; placeholder?:string; secureTextEntry?:boolean}){
  return (
    <TextInput style={styles.input} {...props} />
  )
}

const styles = StyleSheet.create({
  input: {
    height:44,
    borderColor:'#e5e7eb',
    borderWidth:1,
    borderRadius:8,
    paddingHorizontal:10,
    backgroundColor:'#fff'
  }
})
