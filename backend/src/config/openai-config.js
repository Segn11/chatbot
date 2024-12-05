// import { Configuration } from 'openai'
import { OpenAI } from 'openai';

// export const configureOpenAI = () =>{
//     const config = new Configuration({
//         apKey:process.env.OPEN_AI_SECRET,
//         organization:process.env.OPENAI_ORGANIZATION_ID,
//     });
//     return config;
// }

export const configureOpenAI = () => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION_ID,
    });
    return openai;
};
