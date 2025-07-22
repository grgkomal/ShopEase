// src/screens/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Avatar,
  Snackbar,
  HelperText,
  Dialog,
  Portal,
  ActivityIndicator
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserByEmail, getUserById, updateUser, changePassword } from '../services/user';
import { getCache, setCache, removeCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user data...');
      
      const cachedData = await getCache();
      console.log('Cached data:', cachedData);
      
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      let userData = null;
      
      if (cachedData.email) {
        console.log('Fetching user by email:', cachedData.email);
        const emailResponse = await getUserByEmail(cachedData.email);
        
        if (emailResponse && (emailResponse.success || emailResponse.status === 'success') && emailResponse.data) {
          console.log('User fetched by email:', emailResponse.data);
          userData = emailResponse.data;
        } else {
          console.log('Failed to fetch by email:', emailResponse?.message || emailResponse?.error);
        }
      }

      if (!userData && (cachedData.user_id || cachedData.user?.id || cachedData.user?._id)) {
        const userId = cachedData.user_id || cachedData.user?.id || cachedData.user?._id;
        console.log('Fetching user by ID:', userId);
        const idResponse = await getUserById(userId);
        
        if (idResponse && (idResponse.success || idResponse.status === 'success') && idResponse.data) {
          console.log('User fetched by ID:', idResponse.data);
          userData = idResponse.data;
        } else {
          console.log('Failed to fetch by ID:', idResponse?.message || idResponse?.error);
        }
      }

      if (userData) {
        console.log('Setting user data:', userData);
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });

        await setCache(
          cachedData.token, 
          userData.name, 
          userData.email, 
          userData.phone,
          userData.user_id || userData.id || userData._id
        );
      } else {
        console.log('Using cached data as fallback');
        const fallbackUser = {
          user_id: cachedData.user_id || cachedData.user?.id || cachedData.user?._id,
          name: cachedData.name || '',
          email: cachedData.email || '',
          phone: cachedData.phone || '',
          token: cachedData.token
        };
        
        setUser(fallbackUser);
        setFormData({
          name: fallbackUser.name,
          email: fallbackUser.email,
          phone: fallbackUser.phone,
        });
        
        showSnackbar('Using cached profile data. Pull to refresh for latest data.');
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      try {
        const cachedData = await getCache();
        if (cachedData && cachedData.token) {
          const fallbackUser = {
            user_id: cachedData.user_id,
            name: cachedData.name || '',
            email: cachedData.email || '',
            phone: cachedData.phone || '',
            token: cachedData.token
          };
          
          setUser(fallbackUser);
          setFormData({
            name: fallbackUser.name,
            email: fallbackUser.email,
            phone: fallbackUser.phone,
          });
          
          showSnackbar('Network error. Using cached profile data.');
        } else {
          showSnackbar('Error loading user data. Please login again.');
          navigation.replace('Login');
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
        showSnackbar('Error loading user data. Please login again.');
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10-15 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      showSnackbar('User data not available. Please log in.');
      return;
    }

    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      console.log('Updating profile...');

      const userId = user.user_id || user.id || user._id;
      if (!userId) {
        showSnackbar('User ID not found. Please login again.');
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      };

      console.log('Updating user with ID:', userId, 'Data:', updateData);
      
      const result = await updateUser(userId, updateData);
      console.log('Update result:', result);

      if (result && (result.success || result.status === 'success')) {

        const updatedUser = { 
          ...user, 
          ...updateData,
          user_id: userId
        };
        setUser(updatedUser);
        
        const cachedData = await getCache();
        await setCache(
          cachedData.token, 
          updateData.name, 
          updateData.email, 
          updateData.phone,
          userId
        );
        
        showSnackbar('Profile updated successfully');
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to update profile';
        console.error('Update failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Update profile error:', error);
      showSnackbar('Failed to update profile. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setErrors({});
      setSubmitLoading(true);
      console.log('Changing password...');

      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      console.log('Change password result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Password changed successfully');
        setPasswordDialogVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const errorMessage = result?.message || result?.error || 'Password change failed. Please check your current password.';
        console.error('Password change failed:', errorMessage);
        showSnackbar(errorMessage);
      }
    } catch (error) {
      console.error('Change password error:', error);
      showSnackbar('Password change failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Logging out...');
              await removeCache();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              showSnackbar('Error during logout');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    console.log('Refreshing profile data...');
    fetchUserData();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const updatePasswordData = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.notLoggedInText}>You are not logged in.</Text>
        <Button mode="contained" onPress={() => navigation.replace('Login')}>
          Go to Login
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.headerContainer}>
          <Title style={styles.headerTitle}>My Profile</Title>
          <Button
            mode="text"
            onPress={handleRefresh}
            loading={loading}
            disabled={submitLoading}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>

        <Card style={styles.avatarCard}>
          <Card.Content style={styles.avatarContent}>
            <Avatar.Text
              size={100}
              label={getInitials(user.name)}
              style={styles.avatar}
            />
            <Text style={styles.avatarText}>Profile Picture</Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Coming Soon', 'Profile picture change feature will be available soon!')}
              style={styles.changePhotoButton}
            >
              Change Photo
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Personal Information</Title>

            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              error={!!errors.name}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              error={!!errors.email}
              disabled={true}
            />
            <HelperText type="info" visible={true}>
              Email cannot be changed for security reasons
            </HelperText>

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              error={!!errors.phone}
            />
            <HelperText type="error" visible={!!errors.phone}>
              {errors.phone}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={submitLoading}
              style={styles.updateButton}
              disabled={submitLoading}
            >
              Update Profile
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Security</Title>
            <Button
              mode="outlined"
              onPress={() => {
                setPasswordDialogVisible(true);
                setErrors({});
              }}
              style={styles.changePasswordButton}
              disabled={submitLoading}
            >
              Change Password
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Account Status</Title>
            <Text style={styles.statusText}>
              Status: {user.is_active !== false ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.statusText}>
              User ID: {user.user_id || user.id || 'Not available'}
            </Text>
            {user.created_at && (
              <Text style={styles.statusText}>
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="text"
          onPress={handleLogout}
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonText}
          disabled={submitLoading}
        >
          Logout
        </Button>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>

        <Portal>
          <Dialog 
            visible={passwordDialogVisible} 
            onDismiss={() => {
              setPasswordDialogVisible(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setErrors({});
            }}
          >
            <Dialog.Title>Change Password</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Current Password"
                value={passwordData.currentPassword}
                onChangeText={(value) => updatePasswordData('currentPassword', value)}
                secureTextEntry={!showPasswords.current}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon 
                    icon={showPasswords.current ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('current')} 
                  />
                }
                error={!!errors.currentPassword}
              />
              <HelperText type="error" visible={!!errors.currentPassword}>
                {errors.currentPassword}
              </HelperText>

              <TextInput
                label="New Password"
                value={passwordData.newPassword}
                onChangeText={(value) => updatePasswordData('newPassword', value)}
                secureTextEntry={!showPasswords.new}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon 
                    icon={showPasswords.new ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('new')} 
                  />
                }
                error={!!errors.newPassword}
              />
              <HelperText type="error" visible={!!errors.newPassword}>
                {errors.newPassword}
              </HelperText>

              <TextInput
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChangeText={(value) => updatePasswordData('confirmPassword', value)}
                secureTextEntry={!showPasswords.confirm}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon 
                    icon={showPasswords.confirm ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('confirm')} 
                  />
                }
                error={!!errors.confirmPassword}
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                onPress={() => {
                  setPasswordDialogVisible(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleChangePassword} 
                loading={submitLoading}
                disabled={submitLoading}
              >
                Change
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;