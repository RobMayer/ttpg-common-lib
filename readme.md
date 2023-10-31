# ttpg-common-lib

`pnpm add ttpg-common-lib`

`yarn add ttpg-common-lib`

`npm i ttpg-common-lib`

## Storage

```typescript
import { refObject } from "@tabletop-playground/api";
import { Storage } from "ttpg-common-lib";

type MyStore = {
    someKey: string;
};

// format of the storage id is enforced by typescript to help avoid collisions.
const databank = Storage.get<MyStore>(refObject, "@ThatRobHuman/myStoreId");

// will be undefined if not found, hence null coalescence.
const store = databank.load() ?? { someKey: "defaultValue" };

databank.save({ someKey: "newValue" });
```

## EventBus

```typescript
import { GameObject } from "@tabletop-playground/api";
import { EventBus } from "ttpg-common-lib";

// schema of your event bus: key is the "signal", values are vargs for any handler that a handler would take.
type MyEvents = {
    someEvent: [GameObject];
};

// format of the event bus id is enforced by typescript to help avoid collisions.
const bus = EventBus.get<MyEvents>("@ThatRobHuman/myChannelId");

const someHandler = (obj: GameObject) => {
    // do stuff
};

// returns an unsubscribe function
const unsub = bus.subscribe("someEvent", someHandler);

// that you can call to remove the handler
unsub();

// or you can remove it the old-fashioned way
bus.unsubscribe("someEvent", someHandler);

// remove all handlers for this signal
bus.clear("someEvent");
```

## CrossRef

cross ref lets you drop off and pick up data points based on key - think of it as a global non-persistant key-value store, however: it's probably most useful as an object reference store.

```typescript
import { GameObject } from "@tabletop-playground/api";
import { CrossRef } from "ttpg-common-lib";

/* Types.ts */

type Schema = {
    foo: string;
}

/* objectA */

((obj: GameObject) => {

    const utilityData: Schema = {
        foo: "bar";
    }

    const unregister = CrossRef.register<Schema>("@ThatRobHuman/myUtility", obj.getId(), utilityStore);

    obj.onDestroyed.add(() => {
        unregister(); //remove when object is destroyed.
    })

})(refObject)

/* objectB */

((obj: GameObject) => {

    const otherObjectId = "asdf"; //whatever

    obj.onCustomAction.add(() => {
        const thing = CrossRef.get<Schema>("@ThatRobHuman/myUtility", otherObjectId); // might be undefined.
        if (thing) {
            console.log(thing.foo) // "bar"
        }
    })

})

```
