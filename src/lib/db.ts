"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export type CollectionName = "subscriptions" | "debts" | "investments" | "accounts";

function userColl(uid: string, name: CollectionName) {
  return collection(db, "users", uid, name);
}

function fromSnap<T>(snap: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return { id: snap.id, ...(snap.data() as T) };
}

export function watchCollection<T>(
  uid: string,
  name: CollectionName,
  cb: (rows: (T & { id: string })[]) => void
): () => void {
  const q = query(userColl(uid, name), orderBy("name"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => fromSnap<T>(d)));
  });
}

export async function createDoc<T extends Record<string, unknown>>(
  uid: string,
  name: CollectionName,
  data: T
): Promise<string> {
  const ref = await addDoc(userColl(uid, name), data);
  return ref.id;
}

export async function updateRecord<T extends Record<string, unknown>>(
  uid: string,
  name: CollectionName,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(db, "users", uid, name, id), data as DocumentData);
}

export async function deleteRecord(uid: string, name: CollectionName, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, name, id));
}

const SETTINGS_DOC = "paycheck";

export async function getSettings<T>(uid: string): Promise<T | null> {
  const snap = await getDoc(doc(db, "users", uid, "settings", SETTINGS_DOC));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function saveSettings<T extends Record<string, unknown>>(uid: string, data: T): Promise<void> {
  await setDoc(doc(db, "users", uid, "settings", SETTINGS_DOC), data, { merge: true });
}
