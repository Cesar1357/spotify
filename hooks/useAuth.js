import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [displayname, setDisplayName] = useState("");
  const [correo, setCorreo] = useState("");
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUid("");
        setDisplayName("");
        setCorreo("");
        setMetadata({});
      } else {
        setUser(firebaseUser);
        setUid(firebaseUser.uid); 
        setDisplayName(firebaseUser.displayName || "");
        setCorreo(firebaseUser.email || "");
        setMetadata(firebaseUser.metadata || {});
        console.log("|User state changed:", firebaseUser.metadata);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  return { user, loading, uid, displayname, correo, metadata };
}
