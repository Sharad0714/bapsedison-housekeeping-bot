export default {
  async fetch(): Promise<Response> {
    return new Response("BAPS Edison Housekeeping Bot is running!");
  },
};