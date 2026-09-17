import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  getDoc,
  setDoc,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Payment, UserSettings, EmailTemplate } from '../types';

export const savePayment = async (paymentData: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');

  const payment: Payment = {
    ...paymentData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, 'payments'), payment);
    return { ...payment, id: docRef.id };
  } catch (error) {
    console.error('Error saving payment:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, spOrderId: string, status: Payment['status']) => {
  try {
    const docRef = doc(db, 'payments', paymentId);
    await updateDoc(docRef, {
      spOrderId,
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

export const getUserPayments = async () => {
  if (!auth.currentUser) return [];

  const q = query(
    collection(db, 'payments'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getUserSettings = async (): Promise<UserSettings> => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'userSettings', auth.currentUser.uid);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as UserSettings;
  }
  
  return {
    emailNotificationsEnabled: true,
    theme: 'light',
    visibleCards: {
      payments: true,
      history: true,
      gmail: true,
    },
    emailSubjectTemplate: 'Payment Confirmation - Order #{orderId}',
    emailBodyTemplate: 'Dear Customer,\n\nWe have successfully received your payment of {amount} {currency} for Order #{orderId}.\n\nThank you for choosing our service.\n\nBest regards,\nYour Support Team',
    updatedAt: Timestamp.now()
  };
};

export const subscribeToUserSettings = (userId: string, callback: (settings: UserSettings) => void) => {
  const docRef = doc(db, 'userSettings', userId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserSettings);
    } else {
      // Provide defaults if no settings doc exists yet
      callback({
        emailNotificationsEnabled: true,
        theme: 'light',
        visibleCards: {
          payments: true,
          history: true,
          gmail: true,
        },
        emailSubjectTemplate: 'Payment Confirmation - Order #{orderId}',
        emailBodyTemplate: 'Dear Customer,\n\nWe have successfully received your payment of {amount} {currency} for Order #{orderId}.\n\nThank you for choosing our service.\n\nBest regards,\nYour Support Team',
        updatedAt: Timestamp.now()
      });
    }
  });
};

export const updateUserSettings = async (settings: Partial<UserSettings>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'userSettings', auth.currentUser.uid);
  await setDoc(docRef, {
    ...settings,
    updatedAt: Timestamp.now()
  }, { merge: true });
};

// Email Templates
export const saveEmailTemplate = async (templateData: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');

  const template: EmailTemplate = {
    ...templateData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, 'emailTemplates'), template);
    return { ...template, id: docRef.id };
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
};

export const getEmailTemplates = async () => {
  if (!auth.currentUser) return [];

  const q = query(
    collection(db, 'emailTemplates'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
};

export const deleteEmailTemplate = async (templateId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    await deleteDoc(doc(db, 'emailTemplates', templateId));
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
