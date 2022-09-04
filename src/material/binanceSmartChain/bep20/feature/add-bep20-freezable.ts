import type { ContractBuilder, BaseFunction } from "../../../../utils/contract";
import { defineFunctions } from "../../../../utils/define-functions";
import {
  Access,
  requireAccessControl,
} from "../../../common/access/set-access-control";
import { pathPrefix } from "../../../../utils/sourcecode";

export function addBEP20Freezable(c: ContractBuilder, access: Access) {
  c.addParent({
    name: "BEP20Freezable",
    path: `${pathPrefix}/binanceSmartChain/bep20/features/BEP20Freezable.sol`,
  });

  c.addOverride("BEP20Freezable", functions._beforeTokenTransfer);

  requireAccessControl(c, functions.freeze, access, "FREEZER");
  c.addFunctionCode("_freeze(account);", functions.freeze);

  requireAccessControl(c, functions.unfreeze, access, "FREEZER");
  c.addFunctionCode("_unfreeze(account);", functions.unfreeze);
}

const functions = defineFunctions({
  _beforeTokenTransfer: {
    kind: "internal" as const,
    args: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  freeze: {
    kind: "public" as const,
    args: [{ name: "account", type: "address" }],
  },

  unfreeze: {
    kind: "public" as const,
    args: [{ name: "account", type: "address" }],
  },
});
