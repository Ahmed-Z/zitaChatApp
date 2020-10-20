import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/database';
import useSound from 'use-sound';
import notification from './notification.mp3'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import {useAuthState} from 'react-firebase-hooks/auth'
import {useCollectionData} from 'react-firebase-hooks/firestore';
import Particles from 'react-particles-js';


const particlesOptions = {
  "particles": {
    "number": {
        "value": 160,
        "density": {
            "enable": false
        }
    },
    "size": {
        "value": 3,
        "random": true,
        "anim": {
            "speed": 4,
            "size_min": 0.3
        }
    },
    "line_linked": {
        "enable": false
    },
    "move": {
        "random": true,
        "speed": 1,
        "direction": "top",
        "out_mode": "out"
    }
},
"interactivity": {
    "events": {
        "onhover": {
            "enable": true,
            "mode": "bubble"
        },
        "onclick": {
            "enable": true,
            "mode": "repulse"
        }
    },
    "modes": {
        "bubble": {
            "distance": 250,
            "duration": 2,
            "size": 0,
            "opacity": 0
        },
        "repulse": {
            "distance": 400,
            "duration": 4
        }
    }
}
  }

firebase.initializeApp({
    // Config
})
const auth = firebase.auth();
const firestore = firebase.firestore();

function App(){
  return (
    <>
    <div className="App">
    <Particles 
    className='particles'
    params={particlesOptions}
    />
      <ChatSection />
    </div>
    </>
  )}

function ChatSection() {

  const [user] = useAuthState(auth)
  const [soundState, setSoundState] = useState(false);
  
  const soundToggle = (e) => {
    setSoundState(e.target.checked)
  }
  
  return (
    <div className="ChatSection">
    <header>
    <FormControlLabel
          value="start"
          control={<Switch onChange={soundToggle} color="primary" />}
          label="Sound"
          labelPlacement="start"
          checked={soundState}
        />
        {user? "Hello " + user.displayName: ''}
        <SignOut />
      </header>
      <section>
        {user? <Chatroom sound={soundState} /> : <Signin/>}
      </section>
    </div>
  );
}



function Signin(){
  const signInWithGoogle = () =>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
  }
  return (
    <button onClick={signInWithGoogle}>Sign in with google</button>
  )
}

function SignOut(){
  return auth.currentUser && (
    <button className="sign-out" 
    onClick={
      ()=>{
        auth.signOut()
      }
      
      }>
    
    Sign Out</button>
  )

}



function Chatroom(props){
  const dummy = useRef()
  const messageRef = firestore.collection('messages');
  const query = messageRef.orderBy('createdAt')
  const [messages] = useCollectionData(query,{idField: 'id'})
  const [formValue, setFormValue] = useState('')
  const [msglen, setmsglen] = useState(0)
  if (messages){
    if(msglen!==messages.length){
      setmsglen(messages.length)
    }
  }

  const sendMessage = async(e) =>{
    e.preventDefault();
    const {uid,photoURL} = auth.currentUser;
    await messageRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      displayName: auth.currentUser.displayName,
      uid,
      photoURL
    });
    setFormValue('')
  }
  const scrollToBottom = () => {
    dummy.current.scrollIntoView({ behavior: "smooth" })
  }
  const [play] = useSound(notification,{soundEnabled: props.sound});

  useEffect(play, [msglen]);
  useEffect(scrollToBottom, [messages]);

  return(<>
    <div>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/>)}
      <span ref={dummy}></span>
      </main>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e)=>setFormValue(e.target.value)} placeholder='Say something' />
        <button type='submit' disabled={!formValue}>Send</button>
      </form>
    </div>
    </>

  )
}

function ChatMessage(props) {
  const { text, uid, photoURL, displayName, createdAt } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  return (<>
    <div className={`message ${messageClass}`}>
      <img
      alt="profilePic" 
      title={displayName}
      src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p title={createdAt? createdAt.toDate().toString().slice(0,24): ''}>{text}</p>
    </div>
  </>)
}

export default App;
