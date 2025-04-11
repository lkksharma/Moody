import {
	StyleSheet,
	Text,
	View,
	SafeAreaView,
	ScrollView,
	Image,
	Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import { FlatList } from "react-native";
import ArtistCard from "../components/ArtistCard";
import RecentlyPlayedCard from "../components/RecentlyPlayedCard";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
	const [userProfile, setuserProfile] = useState();
	const [recentlyPlayed, setRecentlyPlayed] = useState([]);
	const [topArtists, setTopArtists] = useState([]);
	const navigation = useNavigation();
	const greeting = () => {
		const currentTime = new Date().getHours();
		if (currentTime < 12) {
			return "Good Morning";
		} else if (currentTime < 16) {
			return "Good Afternoon";
		} else {
			return "Good Evening";
		}
	};
	const message = greeting();
	const getProfile = async () => {
		const accessToken = await AsyncStorage.getItem("token");
		try {
			const response = await fetch("https://api.spotify.com/v1/me", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const data = await response.json();
			setuserProfile(data);
			return data;
		} catch (err) {
			console.log(err.message);
		}
	};
	useEffect(() => {
		getProfile();
	}, []);
	console.log(userProfile);
	const getRecentlyPlayedSongs = async () => {
		const accessToken = await AsyncStorage.getItem("token");
		try {
			const response = await axios({
				method: "GET",
				url: "https://api.spotify.com/v1/me/player/recently-played?limit=4",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const tracks = response.data.items;
			setRecentlyPlayed(tracks);
		} catch (err) {
			console.log(err.message);
		}
	};
	useEffect(() => {
		getRecentlyPlayedSongs();
	}, []);

	const renderItem = ({ item }) => {
		return (
			<Pressable
				style={{
					flex: 1,
					flexDirection: "row",
					justifyContent: "space-between",
					marginHorizontal: 10,
					marginVertical: 8,
					backgroundColor: "#282828",
					borderRadius: 4,
					elevation: 3,
				}}
			>
				<Image
					style={{ height: 55, width: 55 }}
					source={{ uri: item.track.album.images[0].url }}
				/>
				<View
					style={{ flex: 1, marginHorizontal: 8, justifyContent: "center" }}
				>
					<Text
						numberOfLines={2}
						style={{ fontSize: 13, fontWeight: 700, color: "white" }}
					>
						{item.track.name}
					</Text>
				</View>
			</Pressable>
		);
	};
	console.log(recentlyPlayed);
	useEffect(() => {
		const getTopItems = async () => {
			try {
				
				const accessToken = await AsyncStorage.getItem("token");
				if (!accessToken) {
					console.log("Access token not found.");
					return;
				}
				const type = "artists";
				const response = await axios.get(
					`https://api.spotify.com/v1/me/top/${type}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);
				setTopArtists(response.data.items);
				console.log("hi");
				console.log("Spotify API response:", response.data.items);
			} catch (err) {
				console.log(err.message);
			}
		};
		getTopItems();
	}, []);

	//   useEffect(() => {
	// 	 console.log("Top Artists state changed:", topArtists);
	//   }, [topArtists])
	console.log("Top Artists: ");
	console.log(recentlyPlayed);
	return (
		<LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
			<ScrollView>
				<View
					style={{
						padding: 10,
						flexDirection: "row",
						flex: 1,
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<View
						style={{
							flexDirection: "row",
							flex: 1,
							alignItems: "center",
							marginTop: 50,
						}}
					>
						<Image
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								resizeMode: "cover",
							}}
							source={{
								uri: userProfile?.images[0]?.url,
							}}
						></Image>
						<Text style={styles.greeting}>
							{message}
							{userProfile?.display_name ? `, ${userProfile.display_name}` : ""}
						</Text>
					</View>

					<MaterialCommunityIcons
						name="lightning-bolt-outline"
						size={24}
						color="white"
					/>
				</View>
				<View
					style={{
						flexDirection: "row",
						marginVertical: 12,
						marginHorizontal: 5,
						alignItems: "center",
						gap: 10,
					}}
				>
					<Pressable
						style={{
							backgroundColor: "#282828",
							padding: 10,
							borderRadius: 30,
						}}
					>
						<Text style={{ fontSize: 15, color: "white" }}>Music</Text>
					</Pressable>

					<Pressable
						style={{
							backgroundColor: "#282828",
							padding: 10,
							borderRadius: 30,
						}}
					>
						<Text style={{ fontSize: 15, color: "white" }}>
							Podcasts & Shows
						</Text>
					</Pressable>
				</View>

				<View style={{ height: 10 }} />

				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Pressable
						onPress={() => navigation.navigate("Liked")}
						style={{
							marginBottom: 10,
							flexDirection: "row",
							alignItems: "center",
							gap: 10,
							flex: 1,
							marginHorizontal: 10,
							marginVertical: 8,
							backgroundColor: "#202020",
							borderRadius: 4,
							elevation: 3,
						}}
					>
						<LinearGradient colors={["#33006F", "#FFFFFF"]}>
							<Pressable
								style={{
									width: 55,
									height: 55,
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<AntDesign name="heart" size={24} color="white" />
							</Pressable>
						</LinearGradient>
						<Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>
							Liked Songs
						</Text>
					</Pressable>

					<View
						style={{
							marginBottom: 10,
							flexDirection: "row",
							alignItems: "center",
							gap: 10,
							flex: 1,
							marginHorizontal: 10,
							marginVertical: 8,
							backgroundColor: "#202020",
							borderRadius: 4,
							elevation: 3,
						}}
					>
						<Image
							style={{ width: 55, height: 55 }}
							source={require("../assets/album_cover.png")}
						/>
						<View>
							<Text style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
								LTGR8MY13.0
							</Text>
						</View>
					</View>
				</View>
				<FlatList
					data={recentlyPlayed}
					renderItem={renderItem}
					numColumns={2}
					columnWrapperStyle={{ justifyContent: "space-between" }}
				/>
				<Text
					style={{
						color: "white",
						fontSize: 19,
						fontWeight: 700,
						marginHorizontal: 20,
						marginTop: 10,
					}}
				>
					Your Top Artists
				</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					{topArtists.map((item, index) => (
						<ArtistCard item={item} key={index} />
					))}
				</ScrollView>
				<View style={{ height: 20 }} />
				<Text
					style={{
						color: "white",
						fontSize: 19,
						fontWeight: 700,
						marginHorizontal: 20,
						marginTop: 10,
					}}
				>
					Recently Played
				</Text>
				<ScrollView contentContainerStyle={styles.container}>
					{recentlyPlayed.map((item, index) => (
						<RecentlyPlayedCard key={index} item={item} />
					))}
				</ScrollView>
			</ScrollView>
		</LinearGradient>
	);
};

export default HomeScreen;

const styles = StyleSheet.create({
	greeting: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
	},
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingBottom: 30,
	},
});
