import { NextAuthConfig } from './node_modules/next-auth/lib/index.d';
import { z } from 'zod';
export const authConfig={
    pages:{
        signIn:"/login",    
    },
    callbacks:{
        authorized({ auth , request:{nextUrl}}){
            const isLoggedIn = !!auth?.user;
            const isOnDashboard=nextUrl.pathname.startsWith('/dashboard');
            if(isOnDashboard){
                if(isLoggedIn) return true;
                return false; // return unauthenticated users to login again
            }else if (isLoggedIn){
                return Response.redirect(new URL("dashboard",nextUrl));
            }
            return true;
        }
    },
   providers:[]
}satisfies NextAuthConfig;