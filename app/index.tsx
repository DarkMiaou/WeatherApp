import { Redirect } from 'expo-router';
import { auth } from '../src/firebase';

export default function Index() {
  return <Redirect href="/screens/Login" />;
}