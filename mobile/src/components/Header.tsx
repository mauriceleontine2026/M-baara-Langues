import { View, Text, StyleSheet } from 'react-native'

export default function Header({title}:{title:string}){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width:0,height:1},
  },
  title: {
    fontSize: 18,
    fontWeight: '600'
  }
})
