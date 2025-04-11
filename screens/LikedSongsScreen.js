import {
	FlatList,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { PreventRemoveContext, useNavigation } from "@react-navigation/native";
import { TextInput } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SongItem from "../components/SongItem";
import { Player } from "./PlayerContext";
import { BottomModal, ModalContent } from "react-native-modals";
import Feather from "@expo/vector-icons/Feather";
import { Audio } from "expo-av";

const LikedSongsScreen = () => {
	const navigation = useNavigation();
	const [input, setInput] = useState("");
	const [savedTracks, setSavedTracks] = useState([]);
	const { currentTrack, setCurrentTrack } = useContext(Player);
	const [modalVisible, setModalVisible] = useState(false);
	const [currentSound, setCurrentSound] = useState(null);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [shuffleMode, setShuffleMode] = useState(false);

	const getSavedTracks = async () => {
		const accessToken = await AsyncStorage.getItem("token");
		const response = await fetch(
			"https://api.spotify.com/v1/me/tracks?offset=0&limit=90",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		if (!response.ok) throw new Error("Failed to fetch tracks");

		const data = await response.json();
		setSavedTracks(data.items);
	};
	useEffect(() => {
		const fetchTracks = async () => {
			const accessToken = await AsyncStorage.getItem("token");
			let allTracks = [];

			for (let offset = 0; offset < 228; offset += 50) {
				const response = await fetch(
					`https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=50`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);
				const data = await response.json();
				if (data.items.length === 0) break;
				allTracks = [...allTracks, ...data.items];
			}

			setSavedTracks(allTracks);
		};

		fetchTracks();
		getSavedTracks();
		console.log(savedTracks);
		let interval;
		const updateProgress = async () => {
			const accessToken = await AsyncStorage.getItem("token");
			const res = await fetch(
				"https://api.spotify.com/v1/me/player/currently-playing",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);
			const data = await res.json();
			if (data && data.progress_ms && data.item.duration_ms) {
				setProgress(data.progress_ms / data.item.duration_ms);
				setCurrentTime(data.progress_ms);
				setTotalDuration(data.item.duration_ms);

				// If track is ending, trigger next song
				if (data.item.duration_ms - data.progress_ms < 1000 && isPlaying) {
					nextTrack();
				}
			}
		};

		interval = setInterval(updateProgress, 1000);
		return () => clearInterval(interval);
	}, [currentTrack, isPlaying]);

	const playTrack = async () => {
		if (savedTracks.length > 0) {
			setCurrentTrack(savedTracks[0]);
			await play(0);
		}
	};

	const play = async (index) => {
		try {
			const accessToken = await AsyncStorage.getItem("token");

			const devicesResponse = await fetch(
				"https://api.spotify.com/v1/me/player/devices",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);
			const devicesData = await devicesResponse.json();

			if (devicesData.devices.length > 0) {
				const activeDevice = devicesData.devices.find(
					(device) => device.is_active
				);
				const deviceId = activeDevice
					? activeDevice.id
					: devicesData.devices[0].id;

				const selectedTrack = savedTracks[index];

				await fetch(
					`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
					{
						method: "PUT",
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							uris: [selectedTrack?.track?.uri],
						}),
					}
				);

				setCurrentTrack(selectedTrack);
				setIsPlaying(true);
				setCurrentIndex(index);
			} else {
				alert("Please open Spotify on a device first");
			}
		} catch (err) {
			console.error("Error playing track:", err);
		}
	};
	play;
	const togglePlayPause = async () => {
		const accessToken = await AsyncStorage.getItem("token");
		await fetch(
			"https://api.spotify.com/v1/me/player/" + (isPlaying ? "pause" : "play"),
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		setIsPlaying(!isPlaying);
	};
	const nextTrack = () => {
		let next = 0;
		if (shuffleMode) {
			do {
				next = getRandomInt(0, savedTracks.length);
			} while (next == currentIndex);
		} else {
			next = (currentIndex + 1) % savedTracks.length;
		}
		play(next);
	};

	const previousTrack = () => {
		if (currentIndex > 0) {
			const prev = currentIndex - 1;
			play(prev);
		}
	};
	const formatTime = (millis) => {
		if (!millis) return "0:00";
		const totalSeconds = Math.floor(millis / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};
	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	const circleSize = 12;

	return (
		<>
			<LinearGradient colors={["#614385", "#581a3c"]} style={{ flex: 1 }}>
				<ScrollView style={{ flex: 1, marginTop: 50 }}>
					<Pressable
						onPress={() => navigation.goBack()}
						style={{ marginHorizontal: 10 }}
					>
						<Ionicons name="arrow-back" size={24} color="white" />
					</Pressable>

					<Pressable
						style={{
							marginHorizontal: 10,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginTop: 9,
						}}
					>
						<Pressable
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 10,
								backgroundColor: "#42275a",
								padding: 9,
								flex: 1,
								borderRadius: 6,
								height: 38,
							}}
						>
							<AntDesign name="search1" size={20} color="white" />
							<TextInput
								value={input}
								onChangeText={(text) => setInput(text)}
								placeholder="Find in Liked songs"
								placeholderTextColor={"white"}
								style={{ fontWeight: "500", color: "white" }}
							/>
						</Pressable>
						<Pressable
							onPress={() => navigation.navigate("Sort")}
							style={{
								marginHorizontal: 10,
								backgroundColor: "#42275a",
								padding: 10,
								borderRadius: 3,
								height: 38,
							}}
						>
							<Text style={{ color: "white" }}>Sort</Text>
						</Pressable>
					</Pressable>

					<View style={{ marginHorizontal: 10, marginTop: 20 }}>
						<Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
							Liked Songs
						</Text>
						<Text style={{ color: "white", fontSize: 13, marginTop: 5 }}>
							{savedTracks.length} Songs
						</Text>
					</View>

					<Pressable
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginTop: 15,
						}}
					>
						<Pressable
							style={{
								width: 30,
								height: 30,
								borderRadius: 15,
								backgroundColor: "#5fc73f",
								justifyContent: "center",
								alignItems: "center",
								marginLeft: 10,
							}}
						>
							<AntDesign name="arrowdown" size={24} color="white" />
						</Pressable>

						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 10,
								marginRight: 10,
							}}
						>
							<Pressable onPress={() => setShuffleMode((prev) => !prev)}>
								<Ionicons
									name="shuffle"
									size={30}
									color={shuffleMode ? "#5fc73f" : "white"}
								/>
							</Pressable>
							<Pressable
								onPress={playTrack}
								style={{
									width: 60,
									height: 60,
									borderRadius: 30,
									backgroundColor: "#5fc73f",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Entypo name="controller-play" size={24} color="white" />
							</Pressable>
						</View>
					</Pressable>

					<FlatList
						showsVerticalScrollIndicator={false}
						data={savedTracks}
						keyExtractor={(item, index) => index.toString()}
						renderItem={({ item }) => <SongItem item={item} />}
					/>
				</ScrollView>
			</LinearGradient>

			{currentTrack && (
				<Pressable
					onPress={() => setModalVisible(true)}
					style={{
						backgroundColor: "#614385",
						width: "90%",
						padding: 10,
						position: "absolute",
						borderRadius: 6,
						left: 20,
						bottom: 10,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
						<Image
							style={{ width: 40, height: 40 }}
							source={{ uri: currentTrack?.track?.album?.images[0].url }}
						/>
						<Text
							numberOfLines={1}
							style={{
								width: 220,
								fontSize: 13,
								fontWeight: "700",
								color: "white",
							}}
						>
							{currentTrack?.track?.name} |{" "}
							{currentTrack?.track?.artists[0].name}
						</Text>
					</View>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
						<AntDesign name="heart" size={24} color="#5fc73f" />
						<Pressable
								onPress={togglePlayPause}
								style={{
									width: 50,
									height: 50,
									borderRadius: 30,
									backgroundColor: "white",
									justifyContent: "center",
									alignItems: "center",
									elevation: 5,
								}}
							>
								<Entypo
									name={isPlaying ? "controller-paus" : "controller-play"}
									size={26}
									color="black"
								/>
							</Pressable>
					</View>
				</Pressable>
			)}

			<BottomModal
				visible={modalVisible}
				onHardwareBackPress={() => setModalVisible(false)}
				swipeDirections={["up", "down"]}
			>
				<ModalContent style={{ height: "100%", backgroundColor: "#614385" }}>
					<View style={{ marginTop: 40 }}>
						<Pressable
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 10,
							}}
						>
							<AntDesign
								onPress={() => setModalVisible(false)}
								name="down"
								size={24}
								color="white"
							/>
							<Text style={{ color: "white", fontSize: 17, fontWeight: "500" }}>
								{currentTrack?.track?.name}
							</Text>
							<Entypo name="dots-three-vertical" size={24} color="white" />
						</Pressable>

						<Image
							style={{
								width: "90%",
								height: 330,
								alignSelf: "center",
								marginTop: 30,
								borderRadius: 4,
							}}
							source={{ uri: currentTrack?.track?.album?.images[0].url }}
						/>

						<View
							style={{
								padding: 20,
								flexDirection: "row",
								justifyContent: "space-between",
							}}
						>
							<View>
								<Text
									numberOfLines={1}
									style={{ fontWeight: "700", fontSize: 18, color: "white" }}
								>
									{currentTrack?.track?.name}
								</Text>
								<Text style={{ marginTop: 4, color: "#d3d3d3" }}>
									{currentTrack?.track?.artists[0].name}
								</Text>
							</View>
							<AntDesign name="heart" size={24} color="#5fc73f" />
						</View>

						<View style={{ marginTop: 10, paddingHorizontal: 20 }}>
							<View
								style={{ height: 3, backgroundColor: "grey", borderRadius: 5 }}
							>
								<View
									style={[
										styles.progressBar,
										{ width: `${(progress || 0) * 100}%` },
									]}
								>
									<View
										style={{
											position: "absolute",
											top: -5,
											left: `${(progress || 0) * 100}%`,
											width: circleSize,
											height: circleSize,
											borderRadius: circleSize / 2,
											backgroundColor: "white",
										}}
									/>
								</View>
							</View>
							<View
								style={{
									marginTop: 12,
									flexDirection: "row",
									justifyContent: "space-between",
								}}
							>
								<Text style={{ color: "#c3c3c3", fontSize: 15 }}>
									{formatTime(currentTime)}
								</Text>
								<Text style={{ color: "#c3c3c3", fontSize: 15 }}>
									{formatTime(totalDuration)}
								</Text>
							</View>
						</View>

						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-around",
								marginTop: 25,
							}}
						>
							<Pressable onPress={() => setShuffleMode((prev) => !prev)}>
								<Ionicons
									name="shuffle"
									size={30}
									color={shuffleMode ? "#5fc73f" : "white"}
								/>
							</Pressable>

							<Pressable onPress={previousTrack}>
								<Ionicons name="play-skip-back" size={30} color="white" />
							</Pressable>
							<Pressable
								onPress={togglePlayPause}
								style={{
									width: 60,
									height: 60,
									borderRadius: 30,
									backgroundColor: "white",
									justifyContent: "center",
									alignItems: "center",
									elevation: 5,
								}}
							>
								<Entypo
									name={isPlaying ? "controller-paus" : "controller-play"}
									size={26}
									color="black"
								/>
							</Pressable>
							<Pressable onPress={nextTrack}>
								<Ionicons name="play-skip-forward" size={30} color="white" />
							</Pressable>
							<Pressable>
								<Feather name="repeat" size={30} color="#03C03C" />
							</Pressable>
						</View>
					</View>
				</ModalContent>
			</BottomModal>
		</>
	);
};

export default LikedSongsScreen;

const styles = StyleSheet.create({
	progressBar: {
		height: "100%",
		backgroundColor: "white",
	},
});
