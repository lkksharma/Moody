import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { use } from 'react'

const MoodySort = () => {
    const [sorted, setSorted] = useState([])
    const navigation = useNavigation()
    const [savedTracks, setSavedTracks] = useState([]);
    const getSortedSongs = async () => {
        console.log("Button pressed");
        try {
            console.log("Trying to get token...");
            const accessToken = await AsyncStorage.getItem("token");
            console.log("Access token retrieved:", accessToken);
        
            if (!accessToken) {
                console.log("Token is null or undefined");
                return;
            }
        
            const trackIds = savedTracks
                    .filter(item => item.track && item.track.id)
                    .map(item => item.track.id);
            const response = await fetch("http://172.16.133.30:5000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: accessToken,
                track_ids: trackIds
            }),
        });
        const predictions = await response.json();
        setSorted(JSON.stringify(predictions, null, 2));
        console.log("The predictions are: ");
        console.log(JSON.stringify(predictions, null, 2));

        navigation.navigate("Moodified", { sorted:  predictions});

        } catch (error) {
            console.error("Error retrieving token:", error);
        }
         

    };
    useEffect(() => {
        const fetchTracks = async () => {
            const accessToken = await AsyncStorage.getItem("token");
            const trackIds = savedTracks
            .filter(item => item.track && item.track.id)
            .map(item => item.track.id);
            console.log("Track IDs:", trackIds);
            let allTracks = [];
        
            for (let offset = 0; offset < 228; offset += 100) {
                
                const response = await fetch(
                    `https://api.spotify.com/v1/playlists/59nMsX9TiR3LfiUz1R11tc/tracks?offset=${offset}&limit=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                const data = await response.json();
                if (!data.items || data.items.length === 0) break;
                allTracks = [...allTracks, ...data.items];
            }
        
            setSavedTracks(allTracks);
            console.log(allTracks);
            console.log("Fetched all tracks from playlist LTGR8MY13.");
            
        };
        

        fetchTracks();
    }
    , []);
    const handlePress = async () => {
        const sortedSongs = await getSortedSongs();
        console.log("Sorted songs:", sortedSongs);
    }
  return (
    <LinearGradient colors={["#614385", "#581a3c"]} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, marginTop: 50 }}>
                    <Pressable
						onPress={() => navigation.goBack()}
						style={{ marginHorizontal: 10 }}
					>
						<Ionicons name="arrow-back" size={24} color="white" />
					</Pressable>
                    <Pressable
                        onPress={handlePress} // getSortedSongs
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 50,
                        }}>
                        <AntDesign name="meho" size={100} color="#5fc73f" />
                        <Text style={{fontSize:40, color:"white", fontWeight:"700", backgroundColor:'rgba(82, 140, 84, 0.5)', borderRadius:20, justifyContent:"center", paddingHorizontal:"10", paddingVertical:"3", marginTop:5}}>moodify</Text>
                    </Pressable>
                    <Text style={{ fontSize: 30, color: "white", fontWeight: "700", textAlign: "center", marginTop: 20 }}>Click the button above to sort your songs by mood</Text>
                    

        </ScrollView>
    </LinearGradient>
  )
}

export default MoodySort

const styles = StyleSheet.create({})