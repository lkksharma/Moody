import { StyleSheet, Text, View, Pressable, ScrollView, FlatList, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign, Entypo, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomModal, ModalContent } from 'react-native-modals';
import { useRoute } from '@react-navigation/native';

const SortedTracks = () => {
  const navigation = useNavigation();
  const [savedTracks, setSavedTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [tracksMap, setTracksMap] = useState({});

  const route = useRoute();
  const { sorted } = route.params || {};
  
  const tracksData = sorted || {};
  
  const mainCategories = Object.keys(tracksData).sort();

  // Fetch tracks from Spotify and map them to their IDs
  useEffect(() => {
    const fetchTracks = async () => {
      const accessToken = await AsyncStorage.getItem("token");
      let allTracks = [];
      
      for (let offset = 0; offset < 228; offset += 50) {
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
      
      // Create a map of track IDs to full track objects
      const trackMap = {};
      allTracks.forEach(item => {
        if (item.track && item.track.id) {
          trackMap[item.track.id] = item;
        }
      });
      
      setTracksMap(trackMap);
    };

    fetchTracks();
    
    // Set up player progress updates
    const intervalId = setInterval(async () => {
      if (isPlaying) {
        await updateProgress();
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isPlaying]);

  const updateProgress = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("token");
      const res = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (res.status === 204) {
        return; // No track is playing
      }
      
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
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const playTrack = async (trackId) => {
    try {
      const track = tracksMap[trackId];
      if (!track) {
        console.error("Track not found:", trackId);
        return;
      }
      
      setCurrentTrack(track);
      
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
        
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [track.track.uri],
            }),
          }
        );
        
        setIsPlaying(true);
        
        // Find the index in savedTracks array for next/previous functionality
        const index = savedTracks.findIndex(item => item.track.id === trackId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      } else {
        alert("Please open Spotify on a device first");
      }
    } catch (err) {
      console.error("Error playing track:", err);
    }
  };

  const togglePlayPause = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("token");
      await fetch(
        `https://api.spotify.com/v1/me/player/${isPlaying ? "pause" : "play"}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const nextTrack = () => {
    if (!savedTracks.length) return;
    
    let next = 0;
    if (shuffleMode) {
      do {
        next = Math.floor(Math.random() * savedTracks.length);
      } while (next === currentIndex);
    } else {
      next = (currentIndex + 1) % savedTracks.length;
    }
    
    const nextTrack = savedTracks[next];
    if (nextTrack && nextTrack.track) {
      playTrack(nextTrack.track.id);
    }
  };

  const previousTrack = () => {
    if (currentIndex > 0 && savedTracks.length) {
      const prev = currentIndex - 1;
      const prevTrack = savedTracks[prev];
      if (prevTrack && prevTrack.track) {
        playTrack(prevTrack.track.id);
      }
    }
  };

  const formatTime = (millis) => {
    if (!millis) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const countTracks = (categoryName) => {
    if (tracksData[categoryName]) {
      return tracksData[categoryName].length;
    }
    return 0;
  };

  const toggleCategory = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  const renderTrackItem = ({item}) => {
    return (
      <Pressable 
        style={styles.trackItem}
        onPress={() => playTrack(item.track_id)}
      >
        <Text style={styles.trackName}>{item.track_name}</Text>
      </Pressable>
    );
  };

  const renderCategoryItem = ({item}) => {
    const isExpanded = expandedCategory === item;
    const trackCount = countTracks(item);
    
    return (
      <View style={styles.categoryContainer}>
        <Pressable 
          style={styles.categoryHeader}
          onPress={() => toggleCategory(item)}
        >
          <Text style={styles.categoryTitle}>
            {item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, ' ')}
          </Text>
          <View style={styles.categoryMeta}>
            <Text style={styles.trackCount}>{trackCount} tracks</Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="white" 
            />
          </View>
        </Pressable>
        
        {isExpanded && tracksData[item] && (
          <FlatList
            data={tracksData[item]}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.track_id}
            style={styles.tracksList}
          />
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={["#614385", "#581a3c"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Music by Mood</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.moodifyHeader}>
          <AntDesign name="meho" size={60} color="#5fc73f" />
          <Text style={styles.moodifyText}>moodify</Text>
        </View>
        
        <Text style={styles.subtitle}>Browse your tracks by mood</Text>
        
        <FlatList
          data={mainCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {currentTrack && (
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.nowPlayingBar}
        >
          <View style={styles.nowPlayingInfo}>
            <Image
              style={styles.albumCover}
              source={{ uri: currentTrack?.track?.album?.images[0]?.url }}
            />
            <Text numberOfLines={1} style={styles.nowPlayingText}>
              {currentTrack?.track?.name} • {currentTrack?.track?.artists[0]?.name}
            </Text>
          </View>
          <View style={styles.nowPlayingControls}>
            <AntDesign name="heart" size={24} color="#5fc73f" />
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
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
        swipeDirection={["up", "down"]}
        onSwipeOut={() => setModalVisible(false)}
      >
        <ModalContent style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalVisible(false)}>
              <AntDesign name="down" size={24} color="white" />
            </Pressable>
            <Text style={styles.modalTitle}>{currentTrack?.track?.name}</Text>
            <Entypo name="dots-three-vertical" size={24} color="white" />
          </View>

          <Image
            style={styles.fullAlbumCover}
            source={{ uri: currentTrack?.track?.album?.images[0]?.url }}
          />

          <View style={styles.songInfo}>
            <View>
              <Text numberOfLines={1} style={styles.songTitle}>
                {currentTrack?.track?.name}
              </Text>
              <Text style={styles.artistName}>
                {currentTrack?.track?.artists[0]?.name}
              </Text>
            </View>
            <AntDesign name="heart" size={24} color="#5fc73f" />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(progress || 0) * 100}%` },
                ]}
              >
                <View style={styles.progressCircle} />
              </View>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
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
            <Pressable onPress={togglePlayPause} style={styles.modalPlayButton}>
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
        </ModalContent>
      </BottomModal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 15,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  moodifyHeader: {
    alignItems: 'center',
    marginTop: 15,
  },
  moodifyText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    backgroundColor: 'rgba(82, 140, 84, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  categoriesList: {
    paddingBottom: 100,
  },
  categoryContainer: {
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  categoryTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackCount: {
    color: '#ddd',
    marginRight: 10,
  },
  tracksList: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  trackItem: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackName: {
    color: 'white',
    fontSize: 16,
  },
  nowPlayingBar: {
    backgroundColor: '#614385',
    width: '90%',
    padding: 10,
    position: 'absolute',
    borderRadius: 6,
    left: '5%',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nowPlayingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  albumCover: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  nowPlayingText: {
    width: '70%',
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  nowPlayingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  modalContent: {
    height: '100%',
    backgroundColor: '#614385',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },
  fullAlbumCover: {
    width: '85%',
    height: 330,
    alignSelf: 'center',
    borderRadius: 8,
  },
  songInfo: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: 'white',
  },
  artistName: {
    marginTop: 4,
    color: '#d3d3d3',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'grey',
    borderRadius: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    top: -4.5,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  timeInfo: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#c3c3c3',
    fontSize: 15,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 25,
  },
  modalPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default SortedTracks;