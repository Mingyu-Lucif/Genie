import Genie from "./genie";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "./utils";
import { web3 } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
``;
export default class Profile {
  genie: Genie;
  initialAuth: web3.PublicKey;
  isInitialized: boolean = false;

  constructor(genie: Genie, initialAuth: web3.PublicKey) {
    this.genie = genie;
    this.initialAuth = initialAuth;
  }

  async initialize(initialAuthProfileKeypair: web3.Keypair) {
    try {
      const program = await this.genie.program;

      if (program === undefined) {
        throw new Error("Genie not initialized");
      }
      if (this.genie.profileMark === undefined) {
        throw new Error("Genie profileMark not initialized");
      }
      const profileData = await program.account.profile
        .fetch(this.key)
        .then((res) => res)
        .catch((err) => undefined);

      if (profileData !== undefined) {
        this.isInitialized = true;
        return this.key;
      }

      const tx = await program.methods
        .initializeProfile()
        .accounts({
          profile: this.key,
          initialAuth: this.initialAuth,
          profileMarkAccount: this.genie.profileMark,
          profileMark: this.genie.profileMark,
          genie: this.genie.key,
          payer: this.genie.client.payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([initialAuthProfileKeypair])
        .rpc({ skipPreflight: true })
        .then((res) => res)
        .catch((error) => {
          throw new Error("profile initialization failed");
        });
      this.isInitialized = true;
      return this.key;
    } catch (err) {}
  }

  get key() {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), this.initialAuth.toBuffer()],
      this.genie.programId
    )[0];
  }

  get profileMarkAccount() {
    return this.genie.profileMark
      ? getAssociatedTokenAddressSync(this.genie.profileMark, this.key, true)
      : undefined;
  }
}