import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Lock } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Fonts } from '@/constants/theme'

const EDGE_PAD = 16
const TILE_GAP = 8
const WIDE_H = 90

interface TileData {
  id: string
  title: string
  desc: string
  active: boolean
  gradient: [string, string]
  route: string | null
}

const GRID_TILES: TileData[] = [
  {
    id: 'ritual',
    title: 'Ритуал',
    desc: 'Ведомое путешествие',
    active: true,
    gradient: ['#1A0A0F', '#2D1520'],
    route: '/(main)/ritual',
  },
  {
    id: 'dice',
    title: 'Случайность',
    desc: 'Воля случая',
    active: false,
    gradient: ['#0A0A1A', '#151528'],
    route: null,
  },
  {
    id: 'stories',
    title: 'Фантазии',
    desc: 'Ролевые погружения',
    active: false,
    gradient: ['#0A0F1A', '#152024'],
    route: null,
  },
  {
    id: 'soon',
    title: 'Скоро...',
    desc: '',
    active: false,
    gradient: ['#0D0D0D', '#151515'],
    route: null,
  },
]

// ─── Grid Tile ────────────────────────────────────────────────────────────────

function GridTile({ tile, router }: { tile: TileData; router: ReturnType<typeof useRouter> }) {
  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={[pressStyle, styles.tile]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPressIn={() => {
          if (tile.active) scale.value = withTiming(0.96, { duration: 120 })
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 240 })
        }}
        onPress={() => {
          if (!tile.active || !tile.route) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
          router.push(tile.route as never)
        }}
      >
        <LinearGradient
          colors={tile.gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[StyleSheet.absoluteFill, styles.tileBorder]} pointerEvents="none" />

        {!tile.active && (
          <>
            <View style={[StyleSheet.absoluteFill, styles.lockedOverlay]} pointerEvents="none" />
            <View style={styles.lockIconWrap} pointerEvents="none">
              <Lock size={16} color="rgba(255,255,255,0.30)" strokeWidth={1.5} />
            </View>
            <Text style={styles.soonLabel}>СКОРО</Text>
          </>
        )}

        <View style={styles.tileContent} pointerEvents="none">
          <Text style={styles.tileName}>{tile.title}</Text>
          {tile.desc ? <Text style={styles.tileDesc}>{tile.desc}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Wide Tile ────────────────────────────────────────────────────────────────

function WideTile() {
  return (
    <View style={styles.wideTile}>
      <LinearGradient
        colors={['#1A0A0F', '#0D0A0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={[StyleSheet.absoluteFill, styles.tileBorder]} />
      <View style={[StyleSheet.absoluteFill, styles.lockedOverlay]} />
      <View style={styles.lockIconWrap}>
        <Lock size={16} color="rgba(255,255,255,0.30)" strokeWidth={1.5} />
      </View>
      <Text style={styles.wideTileName}>Особое погружение</Text>
      <Text style={styles.soonLabelRight}>СКОРО</Text>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ModesHubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.screen}>

      {/* Static background blobs */}
      <View style={styles.blobTopRight} pointerEvents="none" />
      <View style={styles.blobBottomLeft} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerLabel}>КОЛЛЕКЦИЯ</Text>
        <View style={styles.profileCircle} />
      </View>

      {/* 2×2 grid + wide tile */}
      <View style={[styles.grid, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.row}>
          <GridTile tile={GRID_TILES[0]} router={router} />
          <GridTile tile={GRID_TILES[1]} router={router} />
        </View>
        <View style={styles.row}>
          <GridTile tile={GRID_TILES[2]} router={router} />
          <GridTile tile={GRID_TILES[3]} router={router} />
        </View>
        <WideTile />
      </View>

    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  // Blobs — static decorative splashes, no animation
  blobTopRight: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.accent,
    opacity: 0.06,
    top: -80,
    right: -80,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4A1080',
    opacity: 0.06,
    bottom: -40,
    left: -80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: EDGE_PAD,
    paddingBottom: 12,
  },
  headerLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  profileCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  // Grid fills remaining space; rows flex:1 to evenly distribute height
  grid: {
    flex: 1,
    paddingHorizontal: EDGE_PAD,
    gap: TILE_GAP,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: TILE_GAP,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tileBorder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  lockedOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
  },
  lockIconWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  soonLabel: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 7,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tileContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingBottom: 14,
    paddingLeft: 14,
    gap: 4,
  },
  tileName: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  tileDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },
  wideTile: {
    height: WIDE_H,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  wideTileName: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: '#ffffff',
    paddingLeft: 18,
    letterSpacing: 0.1,
  },
  soonLabelRight: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 7,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
})
