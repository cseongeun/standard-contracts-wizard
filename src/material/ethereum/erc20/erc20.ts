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
import { addERC20Mintable } from "./feature/add-erc20-mintable";
import { addERC20Pausable } from "./feature/add-erc20-pausable";
import { addERC20Base } from "./metadata/add-erc20-base";
import { addERC20Premint } from "./metadata/add-erc20-premint";
import { addERC20Lockable } from "./feature/add-erc20-lockable";
import { addERC20Freezable } from "./feature/add-erc20-freezable";
import { addERC20Capped } from "./feature/add-erc20-capped";
import { addERC20BatchTransferable } from "./feature/add-erc20-batchTransferable";


export interface ERC20Options extends CommonOptions {
  metadata: {
    name: string;
    symbol: string;
    premint?: string;
    capped?: string;
  };
  features: {
    burnable?: boolean;
    freezable?: boolean;
    lockable?: boolean;
    pausable?: boolean;
    mintable?: boolean;
    batchTransferable: boolean;
  };
}

export const defaults: Required<ERC20Options> = {
  metadata: {
    name: "MyToken",
    symbol: "MTK",
    premint: "0",
    capped: "0",
  },
  features: {
    burnable: false,
    freezable: false,
    lockable: false,
    pausable: false,
    mintable: false,
    batchTransferable: false,
  },
  access: commonDefaults.access,
  info: commonDefaults.info,
} as const;

function withDefaults(opts: ERC20Options): Required<ERC20Options> {
  return {
    metadata: {
      name: opts.metadata.name ?? defaults.metadata.name,
      symbol: opts.metadata.symbol ?? defaults.metadata.symbol,
      premint: opts.metadata.premint ?? defaults.metadata.premint,
      capped: opts.metadata.capped ?? defaults.metadata.capped,
    },
    features: {
      burnable: opts.features.burnable ?? defaults.features.burnable,
      freezable: opts.features.freezable ?? defaults.features.freezable,
      lockable: opts.features.lockable ?? defaults.features.lockable,
      pausable: opts.features.pausable ?? defaults.features.pausable,
      mintable: opts.features.mintable ?? defaults.features.mintable,
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
  return (opts.features?.mintable ||
    opts.features?.pausable ||
    opts.features?.freezable ||
    opts.features?.lockable) as boolean;
}

export function buildERC20(opts: ERC20Options): Contract {
  const allOpts = withDefaults(opts);

  const c = new ContractBuilder(allOpts.metadata.name);

  const { access, info } = allOpts;

  addERC20Base(c, allOpts.metadata.name, allOpts.metadata.symbol);

  if (allOpts.metadata.capped) {
    addERC20Capped(c, allOpts.metadata.capped);
  }

  if (allOpts.metadata.premint) {
    if (allOpts.metadata.capped != "0") {
      if (
        parseInt(allOpts.metadata.premint) >
        parseInt(allOpts.metadata.capped as string)
      ) {
        addERC20Premint(c, allOpts.metadata.capped as string);
      } else {
        addERC20Premint(c, allOpts.metadata.premint);
      }
    } else {
      addERC20Premint(c, allOpts.metadata.premint);
    }
  }

  if (allOpts.features.burnable) {
    addERC20Burnable(c);
  }

  if (allOpts.features.freezable) {
    addERC20Freezable(c, access);
  }

  if (allOpts.features.pausable) {
    addERC20Pausable(c, access);
  }

  if (allOpts.features.mintable) {
    addERC20Mintable(c, access);
  }

  if (allOpts.features.lockable) {
    addERC20Lockable(c, access);
  }

  if (allOpts.features.batchTransferable) {
    addERC20BatchTransferable(c);
  }

  setAccessControl(c, access);
  setInformation(c, info);

  return c;
}
