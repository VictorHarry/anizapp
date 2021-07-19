import { sendPersona, sendMessage, sendSticker } from './whatsapp/message.js'
import personaStorage from './personaStorage.js';
import axios from 'axios';

function getMinutesUntilNextThirty() {
    if (0 >= (30 - new Date().getMinutes())) return 60 - new Date().getMinutes();
    return 30 - new Date().getMinutes()
}

function getMinutesUntilNextHour() {
    return 60 - new Date().getMinutes()
}

async function sendChosenPersona(sender, group_id, personaName) {
    try {
        const queryPersona = { name: personaName }
        const persona = await axios.post(`${process.env.BASE_URI}/persona/search`, queryPersona)
        const married = await axios.get(`${process.env.BASE_URI}/persona/status/${persona.data._id}`)
        const message = !married.data ?
            `❤️ *${persona.data.name}* ❤️\n\n${persona.data.title}\n\n` + '```Requested by:\n```' + `*${sender.pushname}*`
            :
            `❤️ *${persona.data.name}* ❤️\n\n${persona.data.title}\n\n💍 Married with *${verifyPersonaStatus.data.name}* 💍\n\n` + '```Requested by:\n```' + `*${sender.pushname}*`
        if (persona.data) {
            sendPersona(group_id, persona.data, message)
        } else {
            sendMessage(group_id, `❌ *${queryPersona.name} não encontrado* ❌`)
        }
    } catch (err) {
        console.error(err)
    }
}

async function marry(sender, group_id, requestedPersona) {
    const userStatus = await axios.get(`${process.env.BASE_URI}/user/status/${sender.id}`)
    if (userStatus.data.marry) {
        try {
            const persona = personaStorage.roulettePersonas.find(persona => persona.name === requestedPersona)
            if (persona) {
                await axios.post(`${process.env.BASE_URI}/persona/marry`, { user_id: sender.id, persona_id: persona.id })
                const index = personaStorage.roulettePersonas.findIndex(persona => persona.id == 'persona._id')
                personaStorage.removePersona(index)
                sendMessage(group_id, `💍 *${sender.name}* married *${persona.name}* 💍`)
            }
        } catch (err) {
            console.error(err)
        }
    } else {
        sendMessage(group_id, `Você não pode se casar no momento ⌚ ${getMinutesUntilNextHour()}m restantes`)
    }
}

async function getPersonaWithImage(sender, group_id) {
    try {
        const userStatus = await axios.get(`${process.env.BASE_URI}/user/status/${sender.id}`)
        if (userStatus.data.rolls > 0) {
            await axios.get(`${process.env.BASE_URI}/user/status/roll/${sender.id}`)
            const persona = await axios.get(`${process.env.BASE_URI}/persona/roulette`)
            const married = await axios.get(`${process.env.BASE_URI}/persona/status/${persona.data._id}`)
            const message = married ?
                `❤️ *${persona.name}* ❤️\n\n${persona.title}\n\n_$marry ${persona.name}_\n\n` + '```Roulette by:\n```' + `*${sender.pushname}*`
                :
                `❤️ *${persona.name}* ❤️\n\n${persona.title}\n\n💍 Married with ${married.name} 💍\n\n` + '```Roulette by:\n```' + `*${sender.pushname}*`
            sendPersona(group_id, persona.data, message)
        } else {
            sendMessage(group_id, `Você não possui rolls no momento ⌚ ${getMinutesUntilNextThirty()}m restantes`)
        }
    } catch (err) {
        console.error(err)
    }
}

async function getPersonaWithoutImage(sender, group_id) {
    try {
        const userStatus = await axios.get(`${process.env.BASE_URI}/user/status/${sender.id}`)
        if (userStatus.data.rolls > 0) {
            await axios.get(`${process.env.BASE_URI}/user/status/roll/${sender.id}`)
            const persona = await axios.get(`${process.env.BASE_URI}/persona/roulette`)
            const married = await axios.get(`${process.env.BASE_URI}/persona/status/${persona.data._id}`)
            const message = married ?
                `❤️ *${persona.name}* ❤️\n\n${persona.title}\n\n_$marry ${persona.name}_\n\n` + '```Roulette by:\n```' + `*${sender.pushname}*`
                :
                `❤️ *${persona.name}* ❤️\n\n${persona.title}\n\n💍 Married with ${married.name} 💍\n\n` + '```Roulette by:\n```' + `*${sender.pushname}*`
            sendMessage(group_id, message)
        } else {
            sendMessage(group_id, `Você não possui rolls no momento ⌚ ${getMinutesUntilNextThirty()}m restantes`)
        }
    } catch (err) {
        console.error(err)
    }
}

const createGame = () => {
    // Refatorar esse switch horroroso
    function inputCommand(messageObject) {
        let formatted_command = ''
        if (messageObject.type == 'image') {
            formatted_command = messageObject.caption.match(/^\$\w*/g) ? messageObject.caption.match(/^\$\w*/g)[0] : null
        } else {
            formatted_command = messageObject.body.match(/^\$\w*/g) ? messageObject.body.match(/^\$\w*/g)[0] : null;
        }
        switch (formatted_command) {
            case '$rni':
                getPersonaWithoutImage(messageObject.sender, messageObject.chat.groupMetadata.id)
                break
            case '$r':
                getPersonaWithImage(messageObject.sender, messageObject.chat.groupMetadata.id);
                break
            case '$s':
                const personaName = messageObject.body.replace('$s', '').trim()
                sendChosenPersona(messageObject.sender, messageObject.chat.groupMetadata.id, personaName)
                break
            case '$marry':
                const requestedPersona = messageObject.body.replace('$marry', '').trim()
                marry(messageObject.sender, messageObject.chat.groupMetadata.id, requestedPersona)
                break
            // case '$sticker': // Revisar problemas
            //     sendSticker(messageObject.chat.groupMetadata.id, messageObject.body);
            //     break
        }

    }

    return {
        inputCommand
    }
}

const game = createGame()

export default game