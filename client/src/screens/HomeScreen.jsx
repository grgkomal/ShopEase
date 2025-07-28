

// src/screens/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, RefreshControl,
  ActivityIndicator, Keyboard, StyleSheet, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAllCategories } from '../services/category';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import BottomNavigation from '../navigation/BottomNavigation';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState({ name: 'Guest' });

  useEffect(() => {
    (async () => {
      try {
        const cached = await getCache();
        if (cached?.name) setUser({ name: cached.name });
      } catch (e) {
        console.error('Failed to load user', e);
      }
    })();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getAllCategories();
      if (res.status === 'success' && Array.isArray(res.data)) {
        setCategories(res.data);
        setFilteredCategories(res.data);
      } else {
        setCategories([]);
        setFilteredCategories([]);
        Alert.alert('Error', res.message || 'Failed to fetch categories');
      }
    } catch (e) {
      setCategories([]);
      setFilteredCategories([]);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = cat => {
    const categoryId = cat.category_id || cat.id;
    const categoryName = cat.category_name || cat.name;
    if (!categoryId) return Alert.alert('Error', 'Category ID missing');
    navigation.navigate('ProductCategory', { categoryId, categoryName });
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    if (searchText.trim()) {
      navigation.navigate('ProductCategory', { searchQuery: searchText.trim() });
      setSearchText('');
    }
  };

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredCategories(categories);
    } else {
      const q = searchText.toLowerCase();
      setFilteredCategories(
        categories.filter(cat => {
          const name = (cat.category_name || cat.name || '').toLowerCase();
          const desc = (cat.description || '').toLowerCase();
          return name.includes(q) || desc.includes(q);
        })
      );
    }
  }, [searchText, categories]);

  const renderCategoryItem = category => {
    const imageUrl = category.image_url
      ? category.image_url.startsWith('http')
        ? category.image_url
        : `${config.server}/category/download/${category.image_url.split('/').pop()}`
      : null;

    return (
      <TouchableOpacity
        key={category.category_id || category.id}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.categoryImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="category" size={40} color="#666" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {category.category_name || category.name}
        </Text>
        {category.description && (
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {category.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRightStack}>
          <Text style={styles.appName}>ShopEase</Text>
          <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        
          </View>
          <TouchableOpacity style={styles.accountButton} onPress={() => navigation.navigate('Account')}>
            <Icon name="account-circle" size={30} color="#4CAF50" />
          </TouchableOpacity>       
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.locationButton} onPress={() => navigation.navigate('Location')}>
          <Icon name="location-on" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map(renderCategoryItem)
            ) : (
              <View style={styles.noCategoriesContainer}>
                <Icon name="category" size={60} color="#ccc" />
                <Text style={styles.noCategoriesText}>
                  {loading ? 'Loading…' : 'No categories found'}
                </Text>
                {!loading && (
                  <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Icon name="refresh" size={16} color="#fff" style={styles.retryIcon} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  headerRightStack: {
    flex: 1 ,
    flexDirection:'column',
    justifyContent: 'space-between'
    
  },
  appName: {
    alignItems:'left',
    flexDirection:'row',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  
    marginRight: 20
  },
  welcomeText: {
    flexDirection:'row',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginRight: 20,
  },

  accountButton: {
    alignItems:'right',
    flexDirection:'row',
    padding: 4,
    marginHorizontal: 10,
  },
  
  searchContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: '#fff', 
    alignItems: 'center' 
  },
  searchBar: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f0f0f0', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginRight: 12,
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: 16 
  },
  clearButton: { 
    padding: 4 
  },
  locationButton: { 
    padding: 8 
  },
  categoriesContainer: { 
    padding: 16 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 16 
  },
  categoriesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  categoryCard: {
    width: (width - 48) / 2, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12,
    marginBottom: 16, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { 
      width: 0, height: 2 
    },
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  categoryImageContainer: {
    width: '100%', 
    height: 120, 
    borderRadius: 8, 
    overflow: 'hidden',
    marginBottom: 8, 
    backgroundColor: '#f8f8f8',
  },
  categoryImage: { 
    width: '100%', 
    height: '100%' },
  placeholderImage: {
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0f0f0',
  },
  placeholderText: { 
    fontSize: 10, 
    color: '#666', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  categoryName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 4, 
    textAlign: 'center', 
    lineHeight: 20 
  },
  categoryDescription: { 
    fontSize: 12, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 16 
  },
  noCategoriesContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40, 
    width: '100%' },
  noCategoriesText: { 
    textAlign: 'center', 
    color: '#666', 
    fontSize: 16, 
    marginTop: 16, 
    marginBottom: 20 
  },
  retryButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    backgroundColor: '#4CAF50', 
    borderRadius: 8,
  },
  retryIcon: { 
    marginRight: 8 
  },
  retryButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
});
