import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { user } from "firebase-functions/v1/auth";

initializeApp();

export const usercreated = user().onCreate(async (record) => {
  await getAuth().setCustomUserClaims(record.uid, {
    ...record.customClaims,
    role: "authenticated",
  });
});
