import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";

const RecentlyPlayedCard = ({ item }) => {
	return (
		<Pressable style={{ margin: 10 }}>
			<Image
				style={{ width: 130, height: 130, borderradius: 5 }}
				source={{ uri: item.track.album.images[0].url }}
			/>
			<Text
				numberOfLines={1}
				style={{
					color: "white",
					fontSize: 13,
					fontWeight: 500,
					marginTop: 10,
					marginBottom: 10,
				}}
			>
				{item?.track?.name}
			</Text>
		</Pressable>
	);
};

export default RecentlyPlayedCard;

const styles = StyleSheet.create({});
