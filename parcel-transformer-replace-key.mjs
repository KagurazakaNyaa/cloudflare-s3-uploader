import { Transformer } from "@parcel/plugin";

export default new Transformer({
  async transform({ asset }) {
    // Retrieve the asset's source code and source map.
    let source = await asset.getCode();
    let TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY
      ? process.env.TURNSTILE_SITE_KEY
      : "INVALID_TURNSTILE_KEY";
    let code = source.replace("<TURNSTILE_SITE_KEY>", TURNSTILE_SITE_KEY);
    asset.setCode(code);

    // Return the asset
    return [asset];
  },
});
