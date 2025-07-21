
// src/screens/styles.js
import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 10,
    marginTop: 20,
    marginHorizontal:20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  card: {
    elevation: 4,
    marginBottom: 20,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.primary,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 10,
  },
  resendButton: {
    marginTop: 10,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
});
