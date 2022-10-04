import {
  CommonOptions,
  withCommonDefaults,
  defaults as commonDefaults,
} from "../../../utils/common-options";
import { Contract, ContractBuilder } from "../../../utils/contract";
import { printContract } from "../../../utils/print";
import { setAccessControl } from "../../common/access/set-access-control";
import { setInformation } from "../../common/information/set-info";
import { addERC20Burnable } from "./feature/add-erc20-burnable";
import { addERC20MintableWithCappable } from "./feature/add-erc20-mintable-with-cappable";
import { addERC20Pausable } from "./feature/add-erc20-pausable";
import { addERC20Base } from "./metadata/add-erc20-base";
import { addERC20Initialmint } from "./metadata/add-erc20-initial-mint";
import { addERC20Lockable } from "./feature/add-erc20-lockable";
import { addERC20Freezable } from "./feature/add-erc20-freezable";
import { addERC20BatchTransferable } from "./feature/add-erc20-batchTransferable";
import {
  Access,
  ERC20TypeFeatureType,
  setAccess,
  setFeatures,
} from "../../common/feature/set-features";
import { NetworkType } from "../../common/network";

export interface ERC20Options extends CommonOptions {
  network: NetworkType;
  metadata: {
    name: {
      view: string;
      value: string;
    };
    symbol: {
      view: string;
      value: string;
    };
    initialMint: {
      view: string;
      value: string;
    };
    initialMintAddress: {
      view: string;
      value: string;
    };
  };
  features: {
    mintable?: {
      view: string;
      select: boolean;
      next: {
        cappable?: {
          view: string;
          select: boolean;
          value: string;
        };
      };
    };
    burnable?: {
      view: string;
      select: boolean;
    };
    freezable?: {
      view: string;
      select: boolean;
    };
    lockable?: {
      view: string;
      select: boolean;
    };
    pausable?: {
      view: string;
      select: boolean;
    };
    batchTransferable?: {
      view: string;
      select: boolean;
    };
  };
}

export const defaults: Required<ERC20Options> = {
  network: NetworkType.ETHEREUM,
  metadata: {
    name: {
      view: "Token Name",
      value: "MyToken",
    },
    symbol: {
      view: "Token Symbol",
      value: "MTK",
    },
    initialMint: {
      view: "Initial Minting Amount ",
      value: "0",
    },
    initialMintAddress: {
      view: "Initail Receive Address",
      value: "msg.sender",
    },
  },
  features: {
    mintable: {
      view: "Can Mint",
      select: false,
      next: {
        cappable: {
          view: "Has Cap",
          select: false,
          value: "0",
        },
      },
    },
    burnable: {
      view: "Can Burn",
      select: false,
    },
    freezable: {
      view: "Can Freeze",
      select: false,
    },
    lockable: {
      view: "Can LockUp",
      select: false,
    },
    pausable: {
      view: "Can Pause",
      select: false,
    },
    batchTransferable: {
      view: "Can Batch Transfer",
      select: false,
    },
  },
  access: commonDefaults.access,
  info: commonDefaults.info,
} as const;

function withDefaults(opts: ERC20Options): Required<ERC20Options> {
  return {
    network: opts.network ?? defaults.network,
    metadata: {
      name: opts.metadata.name ?? defaults.metadata.name,
      symbol: opts.metadata.symbol ?? defaults.metadata.symbol,
      initialMint: opts.metadata.initialMint ?? defaults.metadata.initialMint,
      initialMintAddress:
        opts.metadata.initialMintAddress ??
        defaults.metadata.initialMintAddress,
    },
    features: {
      mintable: opts.features.mintable ?? defaults.features.mintable,
      burnable: opts.features.burnable ?? defaults.features.burnable,
      freezable: opts.features.freezable ?? defaults.features.freezable,
      lockable: opts.features.lockable ?? defaults.features.lockable,
      pausable: opts.features.pausable ?? defaults.features.pausable,
      batchTransferable:
        opts.features.batchTransferable ?? defaults.features.batchTransferable,
    },
    ...withCommonDefaults(opts),
  };
}

export function printERC20(opts: ERC20Options = defaults): string {
  return printContract(buildERC20(opts));
}

export function isAccessControlRequired(opts: Partial<ERC20Options>): boolean {
  return (opts.features?.mintable?.select ||
    opts.features?.pausable?.select ||
    opts.features?.freezable?.select ||
    opts.features?.lockable?.select) as boolean;
}

export function buildERC20(opts: ERC20Options): Contract {
  const allOpts = withDefaults(opts);

  const c = new ContractBuilder(allOpts.metadata.name.value);

  const { access, info } = allOpts;
  const features = [];

  // Metadata
  addERC20Base(c, allOpts.metadata.name.value, allOpts.metadata.symbol.value);

  if (allOpts.metadata.initialMint.value != "0") {
    addERC20Initialmint(
      c,
      allOpts.metadata.initialMint.value,
      allOpts.metadata.initialMintAddress.value
    );
  }

  // Features
  if (allOpts.features.burnable?.select) {
    features.push([ERC20TypeFeatureType.BURNABLE]);
    addERC20Burnable(c);
  }

  if (allOpts.features.freezable?.select) {
    features.push([ERC20TypeFeatureType.FREEZABLE]);
    addERC20Freezable(c, access);
  }

  if (allOpts.features.pausable?.select) {
    features.push([ERC20TypeFeatureType.PAUSABLE]);
    addERC20Pausable(c, access);
  }

  if (allOpts.features.mintable?.select) {
    features.push([ERC20TypeFeatureType.MINTABLE]);

    const cappable = allOpts.features.mintable.next.cappable;
    addERC20MintableWithCappable(c, access, cappable);
  }

  if (allOpts.features.lockable?.select) {
    features.push([ERC20TypeFeatureType.LOCKABLE]);
    addERC20Lockable(c, access);
  }

  if (allOpts.features.batchTransferable?.select) {
    features.push([ERC20TypeFeatureType.BATCH_TRANSFERABLE]);
    addERC20BatchTransferable(c);
  }

  setAccessControl(c, access);
  setInformation(c, info);

  setFeatures(c, features);
  setAccess(
    c,
    !access ? Access.NONE : access == "ownable" ? Access.OWNABLE : Access.ROLES
  );
  return c;
}
