const {
    Boom
} = require('@hapi/boom');
const fs = require('fs');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const {
    encrypt
} = require('./enc');
const {
    Octokit
} = require("@octokit/core");
const octokit = new Octokit({
    auth: "your github acessess token",
});

const sessionFolder = './session';

async function startnigg(phone, serviceProvider_) {
    try {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionFolder)
        const negga = makeWASocket({
            version: [2, 3000, 1015901307],
            printQRInTermSyncinal: false,
            logger: pino({
                level: 'silent',
            }),
            browser: Browsers.ubuntu("Chrome"),
            auth: state,
        })

        if (!negga.authState.creds.registered) {
            let phoneNumber = phone ? phone.replace(/[^0-9]/g, '') : ''
            if (phoneNumber.length < 11) {
                return await serviceProvider_.emit('info-pair', {
                    status: true,
                    msg: 'Please Enter Your Number With Country Code !!',
                    isCopy: false,
                    is: 'error'
                });
            }
            await delay(3000);
            try {
                let code = await negga.requestPairingCode(phoneNumber)
                console.log(`Pairing Code for ${phoneNumber}: ${code}`)
                await serviceProvider_.emit('info-pair', {
                    status: true,
                    msg: 'pair code: ' + code,
                    isCopy: true,
                    is: 'info'
                });
            } catch (requestPairingCodeError) {
                await serviceProvider_.emit('info-pair', {
                    status: true,
                    msg: 'Error requesting pairing code from WhatsApp',
                    isCopy: false,
                    is: 'error'
                });
            }
        }

        negga.ev.on('creds.update', saveCreds)
        negga.ev.on('connection.update', async update => {
            const {
                connection,
                lastDisconnect
            } = update
            if (connection) serviceProvider_.emit('info-pair', {
                status: true,
                msg: 'connection status: ' + connection,
                isCopy: false,
                is: 'info'
            });
            if (connection === 'open') {
                await delay(10000)
                const object = {};
                fs.readdirSync(sessionFolder).forEach((plugin) => {
                    if (!plugin.startsWith('pre-key')) {
                        if(fs.existsSync(`${sessionFolder}/${plugin}`)) object[plugin] = require(`.${sessionFolder}/${plugin}`);
                    }
                });
                let a = await octokit.request("POST /gists", {
                    files: {
                        'test': {
                            content: JSON.stringify(object, null, 2)
                        },
                    },
                });
                const ss_id = 'inrl~' + await encrypt(a.data.url.replace('https://api.github.com/gists/', '')) + `::${Object.keys(object).length}`;
                await serviceProvider_.emit('info-pair', {
                    status: true,
                    msg: `session id: ${ss_id}`,
                    isCopy: true,
                    is: 'info'
                });
                await delay(2000)
                await negga.sendMessage(negga.user.id, {
                    text: ss_id
                })
                await delay(2000)
                await negga.sendMessage(
                    negga.user.id, {
                        text: 'Hello there! 👋 \n\nDo not share your session id with anyone.\n\nPut the above in SESSION_ID var\n\nThanks for using INRL-BOT\n\n join support group:- https://chat.whatsapp.com/JCcjvBstDKUGhbqcC2KibS \n',
                    });
                console.log('Connected to WhatsApp Servers')
                if (fs.existsSync(sessionFolder)) {
                    console.log('clearings file');
                    fs.rmSync(sessionFolder, {
                        recursive: true
                    });
                }
                console.log('Faile removed');
                //process.send('reset');
            }
            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode
                console.log('Connection Closed:', reason)
                if (reason === DisconnectReason.connectionClosed) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Connection closed, reconnecting....!]',
                        isCopy: true,
                        is: 'error'
                    });
                } else if (reason === DisconnectReason.connectionLost) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Connection Lost from Server, reconnecting....!]',
                        isCopy: true,
                        is: 'error'
                    });
                } else if (reason === DisconnectReason.loggedOut) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Device Logged Out, Please Try to Login Again....!]',
                        isCopy: false,
                        is: 'error'
                    });
                    if (fs.existsSync(sessionFolder)) {
                        console.log('clearings file');
                        fs.rmSync(sessionFolder, {
                            recursive: true
                        });
                    }
                } else if (reason === DisconnectReason.restartRequired) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Server Restarting....!]',
                        isCopy: false,
                        is: 'error'
                    });
                    startnigg(phone, serviceProvider_);
                } else if (reason === DisconnectReason.timedOut) {
                    console.log('[Connection Timed Out, Trying to Reconnect....!]')
                } else if (reason === DisconnectReason.badSession) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[BadSession exists, Trying to Reconnect....!]',
                        isCopy: false,
                        is: 'error'
                    });
                    if (fs.existsSync(sessionFolder)) {
                        console.log('clearings file');
                        fs.rmSync(sessionFolder, {
                            recursive: true
                        });
                    }
                } else if (reason === DisconnectReason.connectionReplaced) {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Connection Replaced, Trying to Reconnect....!]',
                        isCopy: false,
                        is: 'error'
                    });
                } else {
                    await serviceProvider_.emit('info-pair', {
                        status: true,
                        msg: '[Server Disconnected: Maybe Your WhatsApp Account got Fucked....!]',
                        isCopy: false,
                        is: 'error'
                    });
                }
            }
        })

        negga.ev.on('messages.upsert', () => {})
    } catch (error) {
        if (fs.existsSync(sessionFolder)) {
            console.log('clearings file');
            fs.rmSync(sessionFolder, {
                recursive: true
            });
        }
        console.log(error)
        if (serviceProvider_) await serviceProvider_.emit('info-pair', {
            status: true,
            msg: 'An Error Occurred: ' + error,
            isCopy: false,
            is: 'error'
        });
    }
}

module.exports = startnigg;
