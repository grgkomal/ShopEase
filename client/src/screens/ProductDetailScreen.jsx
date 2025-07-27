
// src/screens/ProductCategory.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StyleSheet,
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

const ProductCategory = ({ route, navigation }) => {
  const { categoryId, categoryName, searchQuery } = route.params || {};
  
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
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
      return itemProductId == productId;
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
      } else if (categoryId) {
        fetchProducts();
      } else {
        fetchAllProducts();
      }
    }
  }, [categoryId, searchQuery, userLoading]);

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
      const response = await getProductsByCategory(categoryId);

      if (response.status === 'success' && response.data) {
        if (Array.isArray(response.data)) {
          setProducts(response.data);
          setFilteredProducts(response.data);
        } else {
          Alert.alert('Error', 'Products data is not in the expected format.');
          setProducts([]);
          setFilteredProducts([]);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
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
      const response = await fetch(`${config.server}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success' && data.data) {
        if (Array.isArray(data.data)) {
          setProducts(data.data);
          setFilteredProducts(data.data);
        } else {
          Alert.alert('Error', 'Products data is not in the expected format.');
          setProducts([]);
          setFilteredProducts([]);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
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
      if (categoryId) {
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
    
    if (searchQuery || searchText.trim()) {
      await handleSearch();
    } else if (categoryId) {
      await fetchProducts();
    } else {
      await fetchAllProducts();
    }
  };
  const handleProductPress = (product) => {
    console.log('Opening product details for:', product.product_name);
    setSelectedProduct(product);
    setProductDetailsVisible(true);
  };

  const closeProductDetails = () => {
    setProductDetailsVisible(false);
    setSelectedProduct(null);
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

    if (product.product_quantity === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
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

      if (product.image_url) {
        if (product.image_url.startsWith('http')) {
          return product.image_url;
        }
        const filename = product.image_url.includes('/') 
          ? product.image_url.split('/').pop() 
          : product.image_url;
        const imageUrl = `${config.server}/product/download/${filename}`;
        return imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Error constructing product image URL:', error);
      return null;
    }
  };

  const renderProductItem = ({ item }) => {
    const imageUrl = getProductImageUrl(item);
    const productId = item.product_id || item.id;
    const isInCart = isProductInCart(productId);
    const quantityInCart = getProductQuantityInCart(productId);
    const isAddingThisProduct = addingToCart[productId];
    const isOutOfStock = item.product_quantity === 0;
    
    return (
      <View style={styles.productCategoryCard}>
        <TouchableOpacity 
          style={styles.productCategoryImageContainer}
          onPress={() => handleProductPress(item)}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productCategoryImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Product image load error for:', imageUrl, error.nativeEvent);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="image" size={40} color="#ccc" />
            </View>
          )}
          
          <View style={styles.infoButtonOverlay}>
            <IconButton
              icon="info"
              size={16}
              iconColor="#fff"
              style={styles.infoButton}
              onPress={() => handleProductPress(item)}
            />
          </View>
        </TouchableOpacity>
        
        <View style={styles.productCategoryInfo}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Text style={styles.productCategoryName} numberOfLines={2}>
              {item.product_name}
            </Text>
          </TouchableOpacity>
          
          {item.description && (
            <Text style={styles.productCategoryDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productCategoryPrice}>₹{item.price}</Text>
              <Text style={styles.quantity}>Qty: {item.product_quantity}</Text>
            </View>
            
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
                styles.productCategoryAddButton,
                (isAddingThisProduct || isOutOfStock ) && styles.addButtonDisabled,
                isInCart && styles.addToCartButtonInCart
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={isAddingThisProduct || isOutOfStock }
            >
              {isAddingThisProduct  ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon 
                    name={isInCart ? "add-shopping-cart" : "add"} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.productCategoryAddButtonText}>
                    {isInCart ? "Add More" : "Add"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {isOutOfStock && (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          )}
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
    const isOutOfStock = selectedProduct.product_quantity === 0;

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
              <Surface style={styles.productImageCard} elevation={1}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.productDetailsImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productDetailsPlaceholder}>
                    <Icon name="image" size={60} color="#ccc" />
                  </View>
                )}
              </Surface>
              <Surface style={styles.detailsCard} elevation={1}>
                <Text style={styles.detailsTitle}>Product Information</Text>
                <Text style={styles.productDetailsName}>{selectedProduct.product_name}</Text>
                <Text style={styles.productDetailsPrice}>₹{selectedProduct.price}</Text>               
                <View style={styles.availabilityRow}>
                  <Text style={styles.detailsText}>
                    Available Quantity: {selectedProduct.product_quantity}
                  </Text>
                  {isOutOfStock ? (
                    <Text style={styles.outOfStockBadge}>Out of Stock</Text>
                  ) : (
                    <Text style={styles.inStockBadge}>In Stock</Text>
                  )}
                </View>                
                {selectedProduct.description && (
                  <>
                    <Text style={styles.descriptionTitle}>Description:</Text>
                    <Text style={styles.detailsText}>{selectedProduct.description}</Text>
                  </>
                )}
              </Surface>
              {isInCart && quantityInCart > 0 && (
                <Surface style={styles.cartStatusCard} elevation={1}>
                  <View style={styles.cartStatusRow}>
                    <Icon name="shopping-cart" size={20} color="#2E7D32" />
                    <Text style={styles.cartStatusTitle}>
                      {quantityInCart} item{quantityInCart > 1 ? 's' : ''} in your cart
                    </Text>
                  </View>
                </Surface>
              )}
              <TouchableOpacity
                style={[
                  styles.detailsAddButton,
                  (isAddingThisProduct || isOutOfStock) && styles.detailsAddButtonDisabled,
                  isInCart && styles.detailsAddButtonInCart
                ]}
                onPress={() => handleAddToCart(selectedProduct)}
                disabled={isAddingThisProduct || isOutOfStock}
              >
                {isAddingThisProduct ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon 
                      name={isInCart ? "add-shopping-cart" : "add-shopping-cart"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.detailsAddButtonText}>
                      {isInCart ? "Add More to Cart" : "Add to Cart"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeProductDetails}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const getHeaderTitle = () => {
    if (searchQuery) return 'Search Results';
    if (categoryName) return categoryName;
    return 'All Products';
  };

  const renderHeader = () => (
    <View>      
      <View style={styles.productCategorySearchContainer}>
        <TextInput
          style={styles.productCategorySearchInput}
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

  if ((loading && !refreshing) || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => {
          const productId = item?.product_id || item?.id;
          return productId ? productId.toString() : `product-${index}`;
        }}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="shopping-basket" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText || searchQuery ? 'No products found' : 'No products available'}
            </Text>
            {(searchText || searchQuery) && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchText('');
                  if (categoryId) {
                    fetchProducts();
                  } else {
                    fetchAllProducts();
                  }
                }}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      {renderProductDetails()}

    </SafeAreaView>
  );
};
export default ProductCategory;

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productCategoryCard: {
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
  productCategoryImageContainer: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productCategoryImage: {
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
  productCategoryInfo: {
    padding: 12,
  },
  productCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategoryDescription: {
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
  productCategoryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  quantity: {
    fontSize: 14,
    color: '#999',
  },
  productCategoryAddButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartButtonInCart: {
    backgroundColor: '#388e3c',
  },
  productCategoryAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
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
  outOfStock: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  productCategorySearchContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCategorySearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 45,
  },
  searchButton: {
    marginLeft: 8,
    padding: 4,
  },
  cartButton: {
    padding: 4,
    marginLeft: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productsContainer: {
    padding: 8,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  detailsDialog: {
    maxHeight: '80%',
  },
  productImageCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productDetailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  productDetailsPlaceholder: {
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
  productDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme?.colors?.text || '#333',
    marginBottom: 8,
  },
  productDetailsPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme?.colors?.primary || '#2E7D32',
    marginBottom: 12,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inStockBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    backgroundColor: '#f44336',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme?.colors?.text || '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: theme?.colors?.text || '#333',
    lineHeight: 20,
  },
  cartStatusCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#e8f5e8',
  },
  cartStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartStatusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
    marginLeft: 8,
  },
  detailsAddButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsAddButtonInCart: {
    backgroundColor: '#1976D2',
  },
  detailsAddButtonDisabled: {
    backgroundColor: '#ccc',
  },
  detailsAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoButtonOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    margin: 0,
    width: 28,
    height: 28,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  productCategorySearchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  productCategorySearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  productsContainer: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCategoryCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productCategoryImageContainer: {
    position: 'relative',
  },
  productCategoryImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productCategoryInfo: {
    padding: 12,
  },
  productCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategoryDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productFooter: {
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCategoryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
  },
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
  productCategoryAddButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartButtonInCart: {
    backgroundColor: '#1976D2',
  },
  productCategoryAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  outOfStock: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#333',
  },
})