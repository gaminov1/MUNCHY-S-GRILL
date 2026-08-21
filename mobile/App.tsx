import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fallbackMenu, TOAST_ORDER_URL } from './src/data/fallbackMenu';
import { getToastMenu } from './src/services/menu';
import type { AppTab, MenuItem } from './src/types';

const FAVORITES_KEY = 'munchys:favorites';
const PHONE_URL = 'tel:5165953500';
const DIRECTIONS_URL = 'https://maps.apple.com/?daddr=12+Irving+Pl,+Woodmere,+NY+11598';

const hours = [
  ['Sunday', '11:00 AM – 1:00 AM'],
  ['Monday', '11:00 AM – 1:00 AM'],
  ['Tuesday', '11:00 AM – 1:00 AM'],
  ['Wednesday', '11:00 AM – 1:00 AM'],
  ['Thursday', '11:00 AM – 1:00 AM'],
  ['Friday', '11:00 AM – 4:00 PM'],
  ['Saturday', '10:00 PM – 1:00 AM'],
];

const tabs: Array<{ id: AppTab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'menu', label: 'Menu', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { id: 'favorites', label: 'Favorites', icon: 'heart-outline', activeIcon: 'heart' },
  { id: 'info', label: 'Info', icon: 'location-outline', activeIcon: 'location' },
];

function formatPrice(price: number | null) {
  return price == null ? 'See price' : `$${price.toFixed(2)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [menu, setMenu] = useState<MenuItem[]>(fallbackMenu);
  const [menuSource, setMenuSource] = useState<'toast' | 'fallback'>('fallback');
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((value) => value && setFavoriteIds(new Set(JSON.parse(value) as string[])))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getToastMenu(controller.signal)
      .then((items) => {
        setMenu(items);
        setMenuSource('toast');
      })
      .catch(() => {
        setMenu(fallbackMenu);
        setMenuSource('fallback');
      })
      .finally(() => setIsMenuLoading(false));
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menu.map((item) => item.category))).filter(Boolean)],
    [menu],
  );

  const filteredMenu = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return menu.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSearch = !normalizedQuery || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [category, menu, query]);

  const favorites = useMemo(() => menu.filter((item) => favoriteIds.has(item.id)), [favoriteIds, menu]);

  const openToast = async (url = TOAST_ORDER_URL) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: '#F97316',
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    });
  };

  const toggleFavorite = async (id: string) => {
    const next = new Set(favoriteIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavoriteIds(next);
    await Haptics.selectionAsync().catch(() => undefined);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])).catch(() => undefined);
  };

  const selectTab = (tab: AppTab) => {
    setActiveTab(tab);
    Haptics.selectionAsync().catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>
        {activeTab === 'home' && (
          <HomeScreen
            featured={menu.slice(0, 4)}
            favoriteIds={favoriteIds}
            onFavorite={toggleFavorite}
            onMenu={() => selectTab('menu')}
            onOrder={openToast}
          />
        )}
        {activeTab === 'menu' && (
          <MenuScreen
            menu={filteredMenu}
            categories={categories}
            category={category}
            query={query}
            favoriteIds={favoriteIds}
            isLoading={isMenuLoading}
            isLive={menuSource === 'toast'}
            onCategory={setCategory}
            onQuery={setQuery}
            onFavorite={toggleFavorite}
            onOrder={openToast}
          />
        )}
        {activeTab === 'favorites' && (
          <FavoritesScreen
            menu={favorites}
            favoriteIds={favoriteIds}
            onFavorite={toggleFavorite}
            onMenu={() => selectTab('menu')}
            onOrder={openToast}
          />
        )}
        {activeTab === 'info' && <InfoScreen onOrder={openToast} />}
        <BottomNavigation activeTab={activeTab} onSelect={selectTab} />
      </View>
    </SafeAreaView>
  );
}

type ItemActions = {
  favoriteIds: Set<string>;
  onFavorite: (id: string) => void;
  onOrder: (url?: string) => void;
};

function HomeScreen({ featured, favoriteIds, onFavorite, onMenu, onOrder }: ItemActions & { featured: MenuItem[]; onMenu: () => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#121A16', '#073D2B', '#0B5B3F']} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Image source={require('./assets/logo2.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.heroEyebrow}>
          <View style={styles.liveDot} />
          <Text style={styles.heroEyebrowText}>WOODMERE’S KOSHER GRILL</Text>
        </View>
        <Text style={styles.heroTitle}>Real flavor.{`\n`}Real kosher.</Text>
        <Text style={styles.heroSubtitle}>Burgers, shawarma, schnitzel and more—made fresh and ordered securely through Toast.</Text>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={() => onOrder()}>
          <Text style={styles.primaryButtonText}>Start an order</Text>
          <Ionicons name="arrow-forward" size={20} color="#111827" />
        </Pressable>
        <View style={styles.secureLine}>
          <Ionicons name="shield-checkmark" size={15} color="#D1FAE5" />
          <Text style={styles.secureLineText}>Secure checkout powered by Toast</Text>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.kicker}>CUSTOMER FAVORITES</Text>
          <Text style={styles.sectionTitle}>What are you craving?</Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={12}><Text style={styles.textButton}>Full menu</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
        {featured.map((item) => (
          <MenuCard key={item.id} item={item} compact favorite={favoriteIds.has(item.id)} onFavorite={onFavorite} onOrder={onOrder} />
        ))}
      </ScrollView>
      <Pressable style={styles.locationCard} onPress={() => Linking.openURL(DIRECTIONS_URL)}>
        <View style={styles.locationIcon}><Ionicons name="location" size={24} color="#FFFFFF" /></View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationLabel}>MUNCHY’S GRILL</Text>
          <Text style={styles.locationTitle}>12 Irving Pl, Woodmere</Text>
          <Text style={styles.locationSubtitle}>Open late • Pickup & delivery</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#6B7280" />
      </Pressable>
    </ScrollView>
  );
}

function MenuScreen({ menu, categories, category, query, favoriteIds, isLoading, isLive, onCategory, onQuery, onFavorite, onOrder }: ItemActions & {
  menu: MenuItem[];
  categories: string[];
  category: string;
  query: string;
  isLoading: boolean;
  isLive: boolean;
  onCategory: (category: string) => void;
  onQuery: (query: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      <View style={styles.pageHeader}>
        <View><Text style={styles.kicker}>MUNCHY’S GRILL</Text><Text style={styles.pageTitle}>Menu</Text></View>
        <View style={[styles.sourceBadge, isLive ? styles.sourceBadgeLive : styles.sourceBadgeFallback]}>
          <View style={[styles.sourceDot, isLive ? styles.sourceDotLive : styles.sourceDotFallback]} />
          <Text style={styles.sourceBadgeText}>{isLive ? 'Live menu' : 'Menu preview'}</Text>
        </View>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onQuery}
          placeholder="Search burgers, shawarma…"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
        {query ? <Pressable onPress={() => onQuery('')} hitSlop={10}><Ionicons name="close-circle" size={20} color="#9CA3AF" /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((item) => (
          <Pressable key={item} style={[styles.categoryPill, category === item && styles.categoryPillActive]} onPress={() => onCategory(item)}>
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {isLoading ? <View style={styles.loadingRow}><ActivityIndicator color="#F97316" /><Text style={styles.loadingText}>Syncing with Toast…</Text></View> : null}
      <View style={styles.menuList}>
        {menu.map((item) => <MenuCard key={item.id} item={item} favorite={favoriteIds.has(item.id)} onFavorite={onFavorite} onOrder={onOrder} />)}
        {!menu.length && <EmptyState icon="search-outline" title="Nothing found" body="Try another item or menu category." />}
      </View>
    </ScrollView>
  );
}

function FavoritesScreen({ menu, favoriteIds, onFavorite, onMenu, onOrder }: ItemActions & { menu: MenuItem[]; onMenu: () => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.pageHeader}><View><Text style={styles.kicker}>SAVED FOR NEXT TIME</Text><Text style={styles.pageTitle}>Favorites</Text></View></View>
      {menu.length ? (
        <View style={styles.menuList}>{menu.map((item) => <MenuCard key={item.id} item={item} favorite={favoriteIds.has(item.id)} onFavorite={onFavorite} onOrder={onOrder} />)}</View>
      ) : (
        <EmptyState icon="heart-outline" title="Your favorites live here" body="Tap the heart beside any menu item for faster ordering next time." action="Browse the menu" onAction={onMenu} />
      )}
    </ScrollView>
  );
}

function InfoScreen({ onOrder }: { onOrder: (url?: string) => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.pageHeader}><View><Text style={styles.kicker}>WOODMERE, NEW YORK</Text><Text style={styles.pageTitle}>Visit Munchy’s</Text></View></View>
      <ImageBackground source={require('./assets/munchys-wrap.jpg')} style={styles.infoHero} imageStyle={styles.infoHeroImage}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.84)']} style={styles.infoHeroGradient}>
          <Text style={styles.infoHeroTitle}>If you ain’t here,{`\n`}you ain’t munching.</Text>
          <Text style={styles.infoHeroAddress}>12 Irving Place • Woodmere, NY 11598</Text>
        </LinearGradient>
      </ImageBackground>
      <View style={styles.quickActions}>
        <QuickAction icon="navigate" label="Directions" onPress={() => Linking.openURL(DIRECTIONS_URL)} />
        <QuickAction icon="call" label="Call" onPress={() => Linking.openURL(PHONE_URL)} />
        <QuickAction icon="bag-handle" label="Order" onPress={() => onOrder()} />
      </View>
      <View style={styles.hoursCard}>
        <View style={styles.hoursHeader}><Ionicons name="time-outline" size={22} color="#F97316" /><Text style={styles.hoursTitle}>Hours</Text></View>
        {hours.map(([day, time]) => <View style={styles.hoursRow} key={day}><Text style={styles.hoursDay}>{day}</Text><Text style={styles.hoursTime}>{time}</Text></View>)}
      </View>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Real flavor. Real kosher.</Text>
        <Text style={styles.aboutText}>Munchy’s Grill is the Five Towns spot for flame-grilled burgers, crispy schnitzel, shawarma, wraps, and late-night favorites.</Text>
      </View>
    </ScrollView>
  );
}

function MenuCard({ item, favorite, compact = false, onFavorite, onOrder }: { item: MenuItem; favorite: boolean; compact?: boolean; onFavorite: (id: string) => void; onOrder: (url?: string) => void }) {
  return (
    <View style={[styles.menuCard, compact && styles.menuCardCompact]}>
      <View style={[styles.menuImageWrap, compact && styles.menuImageWrapCompact]}>
        {item.image ? <Image source={item.image} style={styles.menuImage} resizeMode="cover" /> : (
          <LinearGradient colors={['#FDE68A', '#FB923C']} style={styles.menuImagePlaceholder}><Ionicons name="restaurant" size={28} color="#7C2D12" /></LinearGradient>
        )}
        <Pressable style={styles.favoriteButton} onPress={() => onFavorite(item.id)} hitSlop={8}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? '#EA580C' : '#111827'} />
        </Pressable>
      </View>
      <View style={styles.menuCardBody}>
        <Text style={styles.menuCategory}>{item.category}</Text>
        <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.menuDescription} numberOfLines={compact ? 2 : 3}>{item.description}</Text>
        <View style={styles.menuCardFooter}>
          <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
          <Pressable style={styles.orderMiniButton} onPress={() => onOrder(item.orderUrl || TOAST_ORDER_URL)}><Text style={styles.orderMiniText}>Order</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.buttonPressed]} onPress={onPress}><Ionicons name={icon} size={23} color="#0B5B3F" /><Text style={styles.quickActionText}>{label}</Text></Pressable>;
}

function EmptyState({ icon, title, body, action, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={30} color="#EA580C" /></View>
      <Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>
      {action && onAction ? <Pressable style={styles.emptyAction} onPress={onAction}><Text style={styles.emptyActionText}>{action}</Text></Pressable> : null}
    </View>
  );
}

function BottomNavigation({ activeTab, onSelect }: { activeTab: AppTab; onSelect: (tab: AppTab) => void }) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return <Pressable key={tab.id} style={styles.navItem} onPress={() => onSelect(tab.id)}><Ionicons name={active ? tab.activeIcon : tab.icon} size={23} color={active ? '#EA580C' : '#6B7280'} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text></Pressable>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  app: { flex: 1, backgroundColor: '#F7F4EE' },
  screen: { flex: 1 },
  screenContent: { paddingBottom: 116 },
  hero: { minHeight: 490, paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 34 : 22, paddingBottom: 30, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(249,115,22,0.17)', right: -95, top: 155 },
  logo: { width: 142, height: 66, marginBottom: 28 },
  heroEyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FB923C' },
  heroEyebrowText: { color: '#D1FAE5', fontWeight: '800', fontSize: 11, letterSpacing: 0.9 },
  heroTitle: { color: '#FFFFFF', fontSize: 46, lineHeight: 49, fontWeight: '900', letterSpacing: -1.7, marginTop: 18 },
  heroSubtitle: { color: '#D1D5DB', fontSize: 16, lineHeight: 23, marginTop: 13, maxWidth: 335 },
  primaryButton: { height: 56, marginTop: 24, borderRadius: 18, backgroundColor: '#FB923C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonText: { color: '#111827', fontSize: 17, fontWeight: '900' },
  secureLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 13 },
  secureLineText: { color: '#D1FAE5', fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 28, paddingBottom: 14 },
  kicker: { color: '#EA580C', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: '#111827', fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
  textButton: { color: '#0B5B3F', fontSize: 14, fontWeight: '800' },
  featuredRow: { paddingHorizontal: 18, paddingBottom: 8, gap: 12 },
  locationCard: { marginHorizontal: 18, marginTop: 20, padding: 16, borderRadius: 22, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', shadowColor: '#111827', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  locationIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B5B3F' },
  locationCopy: { flex: 1, marginLeft: 13 },
  locationLabel: { color: '#EA580C', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  locationTitle: { color: '#111827', fontSize: 16, fontWeight: '900', marginTop: 2 },
  locationSubtitle: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  pageHeader: { paddingHorizontal: 18, paddingTop: 25, paddingBottom: 18, backgroundColor: '#F7F4EE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { color: '#111827', fontSize: 36, fontWeight: '900', letterSpacing: -1.2, marginTop: 2 },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  sourceBadgeLive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  sourceBadgeFallback: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  sourceDot: { width: 7, height: 7, borderRadius: 4 },
  sourceDotLive: { backgroundColor: '#10B981' },
  sourceDotFallback: { backgroundColor: '#F97316' },
  sourceBadgeText: { color: '#374151', fontSize: 11, fontWeight: '800' },
  searchBox: { height: 52, marginHorizontal: 18, borderRadius: 17, backgroundColor: '#FFFFFF', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, color: '#111827', fontSize: 15, paddingVertical: 0 },
  categoryRow: { gap: 8, paddingHorizontal: 18, paddingVertical: 15 },
  categoryPill: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryText: { color: '#4B5563', fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: '#FFFFFF' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 9 },
  loadingText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  menuList: { paddingHorizontal: 18, gap: 14 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', shadowColor: '#111827', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  menuCardCompact: { width: 250 },
  menuImageWrap: { height: 178, backgroundColor: '#F3F4F6' },
  menuImageWrapCompact: { height: 150 },
  menuImage: { width: '100%', height: '100%' },
  menuImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  favoriteButton: { position: 'absolute', top: 11, right: 11, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  menuCardBody: { padding: 15 },
  menuCategory: { color: '#EA580C', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  menuName: { color: '#111827', fontSize: 19, fontWeight: '900', letterSpacing: -0.3, marginTop: 3 },
  menuDescription: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 6 },
  menuCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  menuPrice: { color: '#111827', fontSize: 17, fontWeight: '900' },
  orderMiniButton: { backgroundColor: '#0B5B3F', paddingHorizontal: 17, paddingVertical: 9, borderRadius: 999 },
  orderMiniText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  infoHero: { height: 300, marginHorizontal: 18, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  infoHeroImage: { borderRadius: 24 },
  infoHeroGradient: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  infoHeroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  infoHeroAddress: { color: '#E5E7EB', fontSize: 13, marginTop: 8, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginHorizontal: 18, marginTop: 14 },
  quickAction: { flex: 1, minHeight: 76, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#E5E7EB' },
  quickActionText: { color: '#374151', fontSize: 12, fontWeight: '800' },
  hoursCard: { marginHorizontal: 18, marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18 },
  hoursHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 10 },
  hoursTitle: { color: '#111827', fontSize: 20, fontWeight: '900' },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  hoursDay: { color: '#374151', fontSize: 14, fontWeight: '700' },
  hoursTime: { color: '#6B7280', fontSize: 14 },
  aboutCard: { marginHorizontal: 18, marginTop: 14, padding: 20, borderRadius: 22, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  aboutTitle: { color: '#9A3412', fontSize: 20, fontWeight: '900' },
  aboutText: { color: '#7C2D12', fontSize: 14, lineHeight: 21, marginTop: 7 },
  emptyState: { marginHorizontal: 18, marginTop: 35, padding: 28, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#111827', fontSize: 21, fontWeight: '900', marginTop: 16 },
  emptyBody: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  emptyAction: { marginTop: 18, backgroundColor: '#111827', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  emptyActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, paddingBottom: Platform.OS === 'android' ? 10 : 5, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D1D5DB', flexDirection: 'row', shadowColor: '#111827', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  navLabelActive: { color: '#EA580C', fontWeight: '900' },
  buttonPressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
