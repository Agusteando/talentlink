
export const DEFAULT_NOTIFICATION_CHANNELS = {
  emailNewEntries: true,
  emailStatusUpdates: true,
  inAppNewEntries: true,
  inAppStatusUpdates: true,
  pushNewEntries: false,
  pushStatusUpdates: false,
};

/**
 * Normaliza un objeto de canales de notificación aplicando valores por defecto
 * cuando alguna bandera booleana viene como undefined/null.
 */
export function normalizeNotificationChannels(input = {}) {
  return {
    emailNewEntries:
      typeof input.emailNewEntries === "boolean"
        ? input.emailNewEntries
        : DEFAULT_NOTIFICATION_CHANNELS.emailNewEntries,
    emailStatusUpdates:
      typeof input.emailStatusUpdates === "boolean"
        ? input.emailStatusUpdates
        : DEFAULT_NOTIFICATION_CHANNELS.emailStatusUpdates,
    inAppNewEntries:
      typeof input.inAppNewEntries === "boolean"
        ? input.inAppNewEntries
        : DEFAULT_NOTIFICATION_CHANNELS.inAppNewEntries,
    inAppStatusUpdates:
      typeof input.inAppStatusUpdates === "boolean"
        ? input.inAppStatusUpdates
        : DEFAULT_NOTIFICATION_CHANNELS.inAppStatusUpdates,
    pushNewEntries:
      typeof input.pushNewEntries === "boolean"
        ? input.pushNewEntries
        : DEFAULT_NOTIFICATION_CHANNELS.pushNewEntries,
    pushStatusUpdates:
      typeof input.pushStatusUpdates === "boolean"
        ? input.pushStatusUpdates
        : DEFAULT_NOTIFICATION_CHANNELS.pushStatusUpdates,
  };
}
