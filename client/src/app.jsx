import React, {useState, useCallback, useEffect } from 'react';
import { BsPerson } from "react-icons/bs";
import {io} from 'socket.io-client';
import { IoCopyOutline } from "react-icons/io5";
import './App.css';

const socket = io(undefined);

const App = () => {
  const [res, setRes] = useState({
    status: false,
    msg: '',
    isCopy: false
  })
  const [ipt, setIpt] = useState('');
  useEffect(()=>{
    socket.on('info-pair', (data)=>{
      setRes(data);
    })
  }, []);
  const handleCopy = (textToCopy) => {
    navigator.clipboard
      .writeText(textToCopy.replace('pair code:','').replace('session id:','').trim())
      .then(() => {
        console.log("Text copied to clipboard");
        setRes({
          status: true,
          isCopy: false,
          msg: 'item copied',
          is: 'info'
        });
      })
      .catch((err) => {
        console.log("Failed to copy text: ", err)
    setRes({
          status: true,
          isCopy: false,
          msg: err.message,
          is: 'error'
        });
      });
  };
  const submit = useCallback((e) => {
    e.preventDefault();
    setRes({status: false});
    if(!ipt) return setRes({
      status: true,
      msg: 'enter your wa number with country code',
      isCopy: false,
      is: 'error'
    });
    socket.emit('get-pair', ipt);
    return setRes({
      status: true,
      msg: 'please wait a minute',
      isCopy: false,
      is: 'info'
    });
  }, [ipt]);

  return (
    <div>
      <form onSubmit={submit}>
        <BsPerson 
          className="icon"
        />
        <h1>Link devices!</h1>
        {
        res.status && 
        <p
          style={{
            color: res.is === 'error' ? '#ff5454' : '#01803e',
            background: res.is === 'error' ? '#ffb3b3' : '#a5f2db',
            border: res.is === 'error' ? '1px solid #ff7070' : '1px solid #458c65',
          }}
        >{res.msg}
        {res.isCopy && <IoCopyOutline
          className="copy"
          onClick={()=>handleCopy(res.msg)}
        />
          }
        </p>
        }
        <label>Phone number</label>
        <input 
          type="number"
          placeholder="917025 099154"
          value={ipt}
          onChange={(e)=>setIpt(e.target.value)}
        />
        <button type="submit">
      get code</button>
      </form>
    </div>
  )
}

export default App;