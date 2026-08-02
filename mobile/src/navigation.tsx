import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import AudioScreen from './screens/AudioScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import LearnScreen from './screens/LearnScreen';
import LessonScreen from './screens/LessonScreen';
import ProgressScreen from './screens/ProgressScreen';
import ReviewScreen from './screens/ReviewScreen';
import ContributeScreen from './screens/ContributeScreen';
import AITutorScreen from './screens/AITutorScreen';
import StudioScreen from './screens/StudioScreen';
import AdminScreen from './screens/AdminScreen';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Learn" component={LearnScreen} />
        <Tab.Screen name="Contribute" component={ContributeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Audio" component={AudioScreen} />
        <Tab.Screen name="AI Tutor" component={AITutorScreen} />
        <Tab.Screen name="Studio" component={StudioScreen} />
        <Tab.Screen name="Admin" component={AdminScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
