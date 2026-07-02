import "server-only";

import { getSmtpEnvStatus } from "@/lib/mail/smtp";

export type EmailEnvPresence = {
  hasSmtpHost: boolean;
  hasSmtpUser: boolean;
  hasMailFrom: boolean;
  ready: boolean;
};

export function getEmailEnvPresence(): EmailEnvPresence {
  const smtp = getSmtpEnvStatus();
  return {
    hasSmtpHost: smtp.host,
    hasSmtpUser: smtp.user,
    hasMailFrom: smtp.from,
    ready: smtp.ready,
  };
}
