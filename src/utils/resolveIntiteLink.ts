import { MemberJoinInvites } from '@/types';
import Server from '@classes/Server';
import { Collection, GuildMember, Invite, Vanity } from 'discord.js';

declare module '@/types' {
  interface ServerTemp {
    invites: Collection<string, Invite>;
    vanityUses: number;
  }
}

export async function initInvites(server: Server) {
  const vanity = await server.guild.fetchVanityData();
  const inviteCollection = await server.guild.invites.fetch();
  server.temp.vanityUses = vanity?.uses || 0;
  server.temp.invites = inviteCollection;
}

export async function resolveInviteLink(
  server: Server
): Promise<MemberJoinInvites> {
  if (server.guild.vanityURLCode) {
    const vanity = await server.guild.fetchVanityData();
    if (vanity?.code) {
      const newVanityUses = vanity.uses || 0;
      if (server.temp.vanityUses < newVanityUses) {
        server.temp.vanityUses = newVanityUses;
        return [{ code: vanity.code, inviter: 'vanity' }];
      }
    }
  }
  const inviteCollection = await server.guild.invites.fetch();
  const oldInvites = server.temp.invites || new Collection();
  const possibleInvites: Invite[] = [];
  const nowMillis = new Date().getTime();
  for (const [id, invite] of inviteCollection) {
    const newUses = invite.uses || 0;
    const old = oldInvites.get(id);
    if (old) {
      const oldUses = old.uses || 0;
      if (oldUses < newUses) {
        possibleInvites.push(invite);
      }
    } else if (newUses > 0) {
      possibleInvites.push(invite);
    }
  }
  if (possibleInvites.length === 0) {
    // Check if max uses reached
    for (const [id, invite] of oldInvites) {
      const newInvite = inviteCollection.get(id);
      if (invite.maxUses && !newInvite) {
        // max uses or timed out
        const expiresMillis = invite.expiresAt?.getTime() || Infinity;
        if (expiresMillis < nowMillis) continue; // just expired
        const uses = invite.uses || 0;
        if (invite.maxUses - uses === 1) {
          possibleInvites.push(invite);
        }
      }
    }
  }
  server.temp.invites = inviteCollection;
  return possibleInvites.map((invite) => ({
    code: invite.code,
    inviter: invite.inviter?.tag || invite.inviterId || 'unknown',
  }));
}
