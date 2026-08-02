import { Text, StyleSheet, Animated } from 'react-native'

export default function Toast({message}:{message:string}){
  return (
    <Animated.View style={styles.container}>
      <Text style={styles.txt}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container:{
    position:'absolute',
    bottom:40,
    left:20,
    right:20,
    backgroundColor:'#111827',
    padding:12,
    borderRadius:8,
    alignItems:'center'
  },
  txt:{
    color:'#fff'
  }
})
