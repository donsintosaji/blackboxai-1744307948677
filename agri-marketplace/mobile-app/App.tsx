import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <PaperProvider>
        <AuthProvider>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#4CAF50',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            {/* Auth Stack */}
            <Stack.Screen 
              name="Login" 
              getComponent={() => require('./src/screens/auth/LoginScreen').default}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              getComponent={() => require('./src/screens/auth/RegisterScreen').default}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="OTPVerification" 
              getComponent={() => require('./src/screens/auth/OTPVerificationScreen').default}
              options={{ title: 'Verify OTP' }}
            />

            {/* Main Stack */}
            <Stack.Screen 
              name="Home" 
              getComponent={() => require('./src/screens/HomeScreen').default}
              options={{ title: 'AgriMarketplace' }}
            />
            <Stack.Screen 
              name="CropListing" 
              getComponent={() => require('./src/screens/CropListingScreen').default}
              options={{ title: 'Crop Listings' }}
            />
            <Stack.Screen 
              name="CropDetails" 
              getComponent={() => require('./src/screens/CropDetailsScreen').default}
              options={{ title: 'Crop Details' }}
            />
            <Stack.Screen 
              name="Profile" 
              getComponent={() => require('./src/screens/ProfileScreen').default}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen 
              name="Orders" 
              getComponent={() => require('./src/screens/OrdersScreen').default}
              options={{ title: 'My Orders' }}
            />
            <Stack.Screen 
              name="CreateListing" 
              getComponent={() => require('./src/screens/CreateListingScreen').default}
              options={{ title: 'Create Listing' }}
            />
          </Stack.Navigator>
        </AuthProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}
