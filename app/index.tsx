import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';


export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Index Screen Loaded");
    console.log("Usuario:", user);
    console.log("¿Cargando?", loading);
  }, [user, loading]);

if (loading) return null;

if (!user) {
  console.log("Redirigiendo a create porque no hay usuario");
  return <Redirect href="/(sesion)/create" />;
}

console.log("Redirigiendo a tabs porque hay usuario");
return <Redirect href="/(tabs)" />;
}