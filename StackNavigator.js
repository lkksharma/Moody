const { createBottomTabNavigator } = require("@react-navigation/bottom-tabs");
const { default: HomeScreen } = require("./screens/HomeScreen");
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';

const Tab = createBottomTabNavigator();

function BottomTabs() {
	return (
		<Tab.Navigator screenOptions={{
      tabBarStyle:{
        backgroundColor: "rgba(0,0,0,0.8)",
        position: "absolute",
        bottom:0,
        left:0,
        right:0,
        shadowOpacity:1,
        shadowRadius:4,
        elevation:5,
        shadowOffset:{
          width:0,
          height:-4
        },
        borderTopWidth:0
      }
    }}>
			<Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{
					tabBarLabel: "Home",
					headerShown: false,
					tabBarLabelStyle: { color: "white" },
          tabBarIcon: ({focused})=>
            focused?(<Entypo name="home" size={24} color="white" />):(<AntDesign name="home" size={24} color="white" />)
				}}
			/>
      <Tab.Screen
        name = "Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
					headerShown: false,
					tabBarLabelStyle: { color: "white" },
          tabBarIcon: ({focused})=>
            focused?(<Ionicons name="person" size={24} color="white" />):(<Ionicons name="person-outline" size={24} color="white" />)
            
        }}
      />
		</Tab.Navigator>
	);
}

const Stack = createNativeStackNavigator();
function Navigation(){
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}/>
        <Stack.Screen name="Main" component= {BottomTabs} options={{headerShown:false}}/>
        <Stack.Screen name="Liked" component={LikedSongsScreen} options={{headerShown:false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Navigation