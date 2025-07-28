// src/screens/ProductScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Dialog,
  Portal,
  Button,
  Surface,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getProductsByCategory } from '../services/product';
import { addToCart } from '../services/cart';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import { theme } from '../theme/theme';

import BottomNavigation from '../navigation/BottomNavigation';

const ProductScreen = ({ route, navigation }) => {
  const { category_id, categoryName, searchQuery } = route.params || {};
  
  // User state management
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [productDetailsVisible, setProductDetailsVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchUserData = async () => {
    try {
      setUserLoading(true);
      console.log('Fetching user data from cache...');
      
      const cachedData = await getCache();
      console.log('Cached data:', cachedData);
      
      if (cachedData && cachedData.token) {
        const userData = {
          user_id: cachedData.user_id || cachedData.id,
          name: cachedData.name,
          email: cachedData.email,
          phone: cachedData.phone,
          token: cachedData.token
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('No cached user data found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setUserLoading(false);
    }
  };

  const isProductInCart = (productId) => {
    console.log('Checking if product in cart:', productId, 'Cart items:', cartItems);
    return cartItems.some(item => {
      const itemProductId = item.product_id || item.product?.product_id || item.product?.id || item.id;
      console.log('Comparing:', itemProductId, 'with', productId);
      return itemProductId == productId; // Use loose equality to handle string/number differences
    });
  };

  const getProductQuantityInCart = (productId) => {
    const cartItem = cartItems.find(item => {
      const itemProductId = item.product_id || item.product?.product_id || item.product?.id || item.id;
      return itemProductId == productId;
    });
    return cartItem ? cartItem.quantity || 0 : 0;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userLoading) {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else if (category_id) {
        fetchProducts();
      } else {
        fetchAllProducts();
      }
    }
  }, [category_id, searchQuery, userLoading]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products for category:', category_id);
      
      const response = await getProductsByCategory(category_id);
      console.log('Products API Response:', response);

      if (response.status === 'success' && response.data) {
        if (Array.isArray(response.data)) {
          console.log('Setting products:', response.data);
          setProducts(response.data);
          setFilteredProducts(response.data);
        } else {
          console.error('Products is not an array:', response.data);
          Alert.alert('Error', 'Products data is not in the expected format.');
          setProducts([]);
          setFilteredProducts([]);
        }
      } else {
        console.error('API Error:', response.message || 'Unknown error');
        Alert.alert('Error', response.message || 'Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching all products...');
      
      const response = await fetch(`${config.server}/product`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('All Products API Response:', data);

      if (response.ok && data.status === 'success' && data.data) {
        if (Array.isArray(data.data)) {
          console.log('Setting all products:', data.data);
          setProducts(data.data);
          setFilteredProducts(data.data);
        } else {
          console.error('Products is not an array:', data.data);
          Alert.alert('Error', 'Products data is not in the expected format.');
          setProducts([]);
          setFilteredProducts([]);
        }
      } else {
        console.error('API Error:', data.message || 'Unknown error');
        Alert.alert('Error', data.message || 'Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (query = searchText) => {
    if (!query || query.trim() === '') {
      if (category_id) {
        fetchProducts();
      } else {
        fetchAllProducts();
      }
      return;
    }

    try {
      setLoading(true);
      const filtered = products.filter(product =>
        product.product_name.toLowerCase().includes(query.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
      );
      
      setFilteredProducts(filtered);
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    if (searchQuery) {
      await handleSearch(searchQuery);
    } else if (category_id) {
      await fetchProducts();
    } else {
      await fetchAllProducts();
    }
  };

  const handleAddToCart = async (product) => {
    console.log('=== ADD TO CART DEBUG ===');
    console.log('Product data:', product);
    console.log('Is authenticated:', isAuthenticated);
    console.log('User data:', user);
    
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required', 
        'Please login to add items to your cart',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    const productId = product.product_id || product.id;
    console.log('Product ID:', productId);
    
    if (!productId) {
      Alert.alert('Error', 'Invalid product data - no product ID found');
      console.error('Product missing ID:', product);
      return;
    }

    if (!product.price || parseFloat(product.price) <= 0) {
      Alert.alert('Error', 'Invalid product price');
      console.error('Invalid price:', product.price);
      return;
    }

    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      console.log('Adding to cart via service...');

      const cartData = {
        product_id: productId,
        quantity: 1,
        price: parseFloat(product.price),
        product_name: product.product_name,
      };
      
      console.log('Cart data being sent:', cartData);
      
      const result = await addToCart(cartData);
      console.log('Add to cart result:', result);

      if (result.success) {
        Alert.alert('Success', result.message || 'Item added to cart successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to add item to cart');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while adding to cart: ' + error.message);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const getProductImageUrl = (product) => {
    try {
      if (!config || !config.server) {
        console.warn('Config or server URL not available');
        return null;
      }

      if (product?.image_url) {
        if (product.image_url.startsWith('http')) {
          return product.image_url;
        }
        const filename = product.image_url.includes('/') 
          ? product.image_url.split('/').pop() 
          : product.image_url;
        
        const imageUrl = `${config.server}/product/download/${filename}`;
        console.log('Constructed product image URL:', imageUrl);
        return imageUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error constructing product image URL:', error);
      return null;
    }
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setProductDetailsVisible(true);
  };

  const closeProductDetails = () => {
    setProductDetailsVisible(false);
    setSelectedProduct(null);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const renderProductItem = ({ item }) => {
    const imageUrl = getProductImageUrl(item);
    const productId = item.product_id || item.id;
    const isInCart = isProductInCart(productId);
    const quantityInCart = getProductQuantityInCart(productId);
    const isAddingThisProduct = addingToCart[productId];
    const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity <= 0;
    
    console.log('Rendering product:', productId, 'In cart:', isInCart, 'Quantity:', quantityInCart);
    
    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          style={styles.productImageContainer}
          onPress={() => handleProductPress(item)}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Product image load error for:', imageUrl, error.nativeEvent);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="inventory" size={40} color="#666" />
            </View>
          )}
          
          <View style={styles.viewDetailsIcon}>
            <IconButton
              icon="eye"
              size={16}
              onPress={() => handleProductPress(item)}
              style={styles.viewDetailsButton}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product_name}
            </Text>
          </TouchableOpacity>
          
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              ₹{parseFloat(item.price || 0).toFixed(2)}
            </Text>
            {item.original_price && parseFloat(item.original_price) > parseFloat(item.price) && (
              <Text style={styles.originalPrice}>
                ₹{parseFloat(item.original_price).toFixed(2)}
              </Text>
            )}
          </View>

          {item.stock_quantity !== undefined && (
            <Text style={[
              styles.stockText,
              item.stock_quantity > 0 ? styles.inStock : styles.outOfStock
            ]}>
              {item.stock_quantity > 0 ? `In Stock (${item.stock_quantity})` : 'Out of Stock'}
            </Text>
          )}

          {isInCart && quantityInCart > 0 && (
            <View style={styles.cartStatusContainer}>
              <Icon name="shopping-cart" size={16} color="#2E7D32" />
              <Text style={styles.cartStatusText}>
                {quantityInCart} in cart
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              (isAddingThisProduct || isOutOfStock || cartLoading) && styles.addToCartButtonDisabled,
              isInCart && styles.addToCartButtonInCart
            ]}
            onPress={() => {
              console.log('Add to cart button pressed for product:', productId);
              handleAddToCart(item);
            }}
            disabled={isAddingThisProduct || isOutOfStock || cartLoading}
          >
            {isAddingThisProduct || cartLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon 
                  name={isInCart ? "add-shopping-cart" : "add-shopping-cart"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addToCartButtonText}>
                  {isInCart ? "Add More" : "Add to Cart"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProductDetails = () => {
    if (!selectedProduct) return null;

    const imageUrl = getProductImageUrl(selectedProduct);
    const productId = selectedProduct.product_id || selectedProduct.id;
    const isInCart = isProductInCart(productId);
    const quantityInCart = getProductQuantityInCart(productId);
    const isAddingThisProduct = addingToCart[productId];
    const isOutOfStock = selectedProduct.stock_quantity !== undefined && selectedProduct.stock_quantity <= 0;

    return (
      <Portal>
        <Dialog 
          visible={productDetailsVisible} 
          onDismiss={closeProductDetails}
          style={styles.detailsDialog}
        >
          <Dialog.Title>Product Details</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Surface style={styles.detailsImageContainer} elevation={2}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.detailsImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.detailsPlaceholderImage}>
                    <Icon name="inventory" size={80} color="#666" />
                  </View>
                )}
              </Surface>

              <Surface style={styles.detailsCard} elevation={1}>
                <Text style={styles.detailsTitle}>Product Information</Text>
                <Text style={styles.detailsProductName}>{selectedProduct.product_name}</Text>
                
                {selectedProduct.description && (
                  <Text style={styles.detailsDescription}>
                    {selectedProduct.description}
                  </Text>
                )}

                <View style={styles.detailsPriceContainer}>
                  <Text style={styles.detailsPrice}>
                    {formatCurrency(selectedProduct.price)}
                  </Text>
                  {selectedProduct.original_price && parseFloat(selectedProduct.original_price) > parseFloat(selectedProduct.price) && (
                    <Text style={styles.detailsOriginalPrice}>
                      {formatCurrency(selectedProduct.original_price)}
                    </Text>
                  )}
                </View>

                {selectedProduct.stock_quantity !== undefined && (
                  <Text style={[
                    styles.detailsStockText,
                    selectedProduct.stock_quantity > 0 ? styles.inStock : styles.outOfStock
                  ]}>
                    {selectedProduct.stock_quantity > 0 
                      ? `In Stock (${selectedProduct.stock_quantity} available)` 
                      : 'Out of Stock'
                    }
                  </Text>
                )}

                <Text style={styles.detailsText}>
                  Product ID: #{productId}
                </Text>
              </Surface>

              {(selectedProduct.category_name || selectedProduct.brand || selectedProduct.weight) && (
                <Surface style={styles.detailsCard} elevation={1}>
                  <Text style={styles.detailsTitle}>Additional Information</Text>
                  
                  {selectedProduct.category_name && (
                    <Text style={styles.detailsText}>
                      Category: {selectedProduct.category_name}
                    </Text>
                  )}
                  
                  {selectedProduct.brand && (
                    <Text style={styles.detailsText}>
                      Brand: {selectedProduct.brand}
                    </Text>
                  )}
                  
                  {selectedProduct.weight && (
                    <Text style={styles.detailsText}>
                      Weight: {selectedProduct.weight}
                    </Text>
                  )}
                </Surface>
              )}

              {isInCart && quantityInCart > 0 && (
                <Surface style={styles.detailsCard} elevation={1}>
                  <Text style={styles.detailsTitle}>Cart Status</Text>
                  <View style={styles.cartStatusContainer}>
                    <Icon name="shopping-cart" size={20} color="#2E7D32" />
                    <Text style={styles.detailsCartStatusText}>
                      {quantityInCart} item{quantityInCart > 1 ? 's' : ''} in cart
                    </Text>
                  </View>
                </Surface>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeProductDetails}>Close</Button>
            <Button 
              onPress={() => {
                handleAddToCart(selectedProduct);
                closeProductDetails();
              }}
              loading={isAddingThisProduct}
              disabled={isAddingThisProduct || isOutOfStock || cartLoading}
              mode="contained"
            >
              {isInCart ? "Add More" : "Add to Cart"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search products...`}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch()}
        >
          <Icon name="search" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-cart" size={20} color="#2E7D32" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItems.reduce((total, item) => total + (item.quantity || 0), 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inventory" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptyText}>
        {searchText.trim() 
          ? `No products found for "${searchText}"`
          : 'No products available in this category'
        }
      </Text>
      {searchText.trim() && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchText('')}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if ((loading && !refreshing) || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchBar()}
      
      <View style={styles.contentContainer}>
        {filteredProducts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => {
              const productId = item.product_id || item.id;
              return productId ? productId.toString() : `product-${Math.random()}`;
            }}
            numColumns={2}
            contentContainerStyle={styles.productList}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.flatListStyle}
          />
        )}
      </View>

      {renderProductDetails()}

      <BottomNavigation navigation={navigation} activeRoute="Products" />
    </SafeAreaView>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Search bar styles
  searchBarContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 45,
    marginRight: 8,
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Content container
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Product list styles
  productList: {
    padding: 8,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  flatListStyle: {
    flex: 1,
  },

  // Product card styles
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    width: (Dimensions.get('window').width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImageContainer: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  viewDetailsButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    margin: 0,
    width: 28,
    height: 28,
  },

  // Product info styles
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockText: {
    fontSize: 12,
    marginBottom: 8,
  },
  inStock: {
    color: '#4CAF50',
  },
  outOfStock: {
    color: '#f44336',
  },

  // Cart status styles
  cartStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartStatusText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 4,
  },

  // Add to cart button styles
  addToCartButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartButtonInCart: {
    backgroundColor: '#388e3c',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  clearSearchButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Product details dialog styles
  detailsDialog: {
    maxHeight: '80%',
  },
  detailsImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  detailsPlaceholderImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  detailsCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: theme?.colors?.surfaceVariant || '#f8f9fa',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme?.colors?.text || '#333',
    marginBottom: 8,
  },
  detailsProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme?.colors?.text || '#333',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme?.colors?.primary || '#2E7D32',
  },
  detailsOriginalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  detailsStockText: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: theme?.colors?.text || '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  detailsCartStatusText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
  },
});