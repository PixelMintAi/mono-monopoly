import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.username) return null;
        
        // In a real app, you would validate against a database
        // For now, we'll just accept any username
        return {
          id: credentials.username,
          name: credentials.username,
          email: `${credentials.username}@example.com`
        };
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key', // In production, use a proper secret
}; 