import firebase from 'firebase/app'
import { firebaseConfig } from './config'

import 'firebase/auth'
import 'firebase/firestore'

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()
const db = firebase.firestore()

export const userFirebase = {
	get: (userID) => db.collection('user').doc(userID).get(),
	getAll: () => db.collection('user').get(),
	subAll: (setState) =>
		db.collection('user').onSnapshot(async (snapshot) => {
			const data = await getUserList(snapshot)
			setState(data)
		}),
	set: (discordId, data) => db.collection('user').doc(discordId).set(data),
}

export const createUser = async ({ email, id }) => {
	console.log(email, id)
	try {
		return auth.createUserWithEmailAndPassword(email, id)
	} catch (err) {
		switch (err.code) {
			case 'auth/email-already-in-use':
				logInFirebase({ email, id })
				break
			case 'auth/invalid-email':
				console.error(`Email address ${email} is invalid.`)
				break
			case 'auth/operation-not-allowed':
				console.error(`Error during sign up.`)
				break
			case 'auth/weak-password':
				console.error(
					'Password is not strong enough. Add additional characters including special characters and numbers.'
				)
				break
			default:
				console.error('ERROR DURING SIGNUP', err.message)
				break
		}
	}
}

export const logInFirebase = async ({ email, id }) => {
	try {
		return auth.signInWithEmailAndPassword(email, id)
	} catch (err) {
		switch (err.code) {
			case 'auth/invalid-email':
				console.error(`Email address ${email} is invalid.`)
				break
			case 'auth/user-disabled':
				console.error(`Your account has been disabled.`)
				break
			case 'auth/user-not-found':
				console.error('User not found')
				break
			case 'auth/wrong-password':
				console.error('Password is invalid')
				break
			default:
				console.error('ERROR DURING LOGIN', err.message)
				break
		}
	}
}

// get all users on fb, users need key on object for antd table.
export const getUserList = async (users) => {
	return Promise.all(
		users.docs.map(async (user) => {
			const data = await user.data()
			return { key: user.id, ...data }
		})
	)
}
