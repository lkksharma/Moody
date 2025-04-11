import { StyleSheet, Text, View, SafeAreaView, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as AuthSession from "expo-auth-session";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Register your scheme to handle the redirect
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
	const navigation = useNavigation();
	const [authProgress, setAuthProgress] = useState(false);

	useEffect(() => {
		// Check if token exists and is valid
		const checkTokenValidity = async () => {
			const accessToken = await AsyncStorage.getItem("token");
			const expirationDate = await AsyncStorage.getItem("expirationDate");

			console.log("Access Token:", accessToken);
			console.log("Expiration:", expirationDate);

			if (accessToken && expirationDate) {
				const currentTime = Date.now();
				if (currentTime < parseInt(expirationDate)) {
					navigation.replace("Main");
				} else {
					await AsyncStorage.removeItem("token");
					await AsyncStorage.removeItem("expirationDate");
				}
			}
		};
		checkTokenValidity();

		// Set up linking listener for auth redirects
		const handleRedirect = (event) => {
			if (event.url.includes("access_token")) {
				handleAuthResponse(event.url);
			}
		};
		// Add event listener for when app is opened via deep link
		Linking.addEventListener("url", handleRedirect);

		const subscription = Linking.addEventListener("url", handleRedirect);

		return () => {
			subscription.remove(); // Correct way to clean up the listener
		};
	}, []);

	// Handle the auth response URL
	const handleAuthResponse = async (url) => {
		try {
			// Extract the access token from the URL fragment
			const fragmentIndex = url.indexOf("#");
			if (fragmentIndex > -1) {
				const fragment = url.substring(fragmentIndex + 1);
				const params = new URLSearchParams(fragment);
				const accessToken = params.get("access_token");
				const expiresIn = params.get("expires_in");

				if (accessToken) {
					console.log("Got access token:", accessToken);
					const expirationDate =
						new Date().getTime() + parseInt(expiresIn) * 1000;
					await AsyncStorage.setItem("token", accessToken);
					await AsyncStorage.setItem(
						"expirationDate",
						expirationDate.toString()
					);
					setAuthProgress(false);
					navigation.navigate("Main");
				}
			}
		} catch (error) {
			console.error("Error handling auth response:", error);
			setAuthProgress(false);
		}
	};

	async function authenticate() {
		try {
			setAuthProgress(true);

			const redirectUri = AuthSession.makeRedirectUri({
				native: "genred-spotify-auth://callback",
			});

			console.log("Using Redirect URI:", redirectUri);

			const authUrl = `https://accounts.spotify.com/authorize?client_id=41ee2d3de3104070ba48a81212e550eb&response_type=token&redirect_uri=${encodeURIComponent(
                redirectUri
            )}&scope=user-read-email%20user-read-private%20user-library-read%20user-read-recently-played%20user-top-read%20playlist-read-private%20playlist-read-collaborative%20playlist-modify-public%20user-modify-playback-state%20user-read-playback-state`;

			console.log("Auth URL:", authUrl);

			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				redirectUri
			);
			console.log("Auth Result:", result);

			if (result.type === "success" && result.url) {
				await handleAuthResponse(result.url);
			} else {
				console.error("Authentication failed or was cancelled:", result);
				setAuthProgress(false);
			}
		} catch (error) {
			console.error("Authentication error:", error);
			setAuthProgress(false);
		}
	}

	return (
		<LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
			<SafeAreaView>
				<View style={{ height: 80 }} />
				<Entypo
					style={{ textAlign: "center" }}
					name="spotify"
					size={80}
					color="white"
				/>
				<Text
					style={{
						color: "white",
						fontSize: 40,
						fontWeight: "bold",
						textAlign: "center",
						marginTop: 40,
					}}
				>
					Millions of Songs Free on Spotify!
				</Text>
				<View style={{ height: 80 }} />
				<Pressable
					onPress={authenticate}
					disabled={authProgress}
					style={{
						backgroundColor: authProgress ? "#137c32" : "#1DB954",
						padding: 10,
						marginVertical: 10,
						marginLeft: "auto",
						marginRight: "auto",
						width: 300,
						borderRadius: 25,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text>{authProgress ? "Signing in..." : "Sign In with Spotify"}</Text>
				</Pressable>
				<Pressable
					style={{
						backgroundColor: "#131624",
						padding: 10,
						marginVertical: 10,
						marginLeft: "auto",
						marginRight: "auto",
						width: 300,
						borderRadius: 25,
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "row",
						borderColor: "#C0C0C0",
						borderWidth: 0.8,
					}}
				>
					<MaterialIcons name="phone-android" size={24} color="white" />
					<Text
						style={{
							fontWeight: 500,
							color: "white",
							textAlign: "center",
							flex: 1,
						}}
					>
						Continue with phone number
					</Text>
				</Pressable>
				<Pressable
					style={{
						backgroundColor: "#131624",
						padding: 10,
						marginVertical: 10,
						marginLeft: "auto",
						marginRight: "auto",
						width: 300,
						borderRadius: 25,
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "row",
						borderColor: "#C0C0C0",
						borderWidth: 0.8,
					}}
				>
					<AntDesign name="google" size={24} color="red" />
					<Text
						style={{
							fontWeight: 500,
							color: "white",
							textAlign: "center",
							flex: 1,
						}}
					>
						Continue with Google
					</Text>
				</Pressable>
				<Pressable
					style={{
						backgroundColor: "#131624",
						padding: 10,
						marginVertical: 10,
						marginLeft: "auto",
						marginRight: "auto",
						width: 300,
						borderRadius: 25,
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "row",
						borderColor: "#C0C0C0",
						borderWidth: 0.8,
					}}
				>
					<Entypo name="facebook-with-circle" size={24} color="blue" />
					<Text
						style={{
							fontWeight: 500,
							color: "white",
							textAlign: "center",
							flex: 1,
						}}
					>
						Continue with Facebook
					</Text>
				</Pressable>
			</SafeAreaView>
		</LinearGradient>
	);
};

export default LoginScreen;

const styles = StyleSheet.create({});
