import type { ReactNode } from 'react'
import { Modal as RNModal, View, StyleSheet } from 'react-native'

export default function Modal({visible, children}:{visible:boolean; children:ReactNode}){
  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>{children}</View>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  backdrop:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.4)',
    alignItems:'center',
    justifyContent:'center'
  },
  sheet:{
    width:'90%',
    backgroundColor:'#fff',
    borderRadius:12,
    padding:16
  }
})
