function checkKey(value, key) {
    if (value === null) {
        console.error(`Error: trying to access '${key}' of null.`)
        return false
    } else if (typeof value === 'undefined') {
        console.error(`Error: trying to access '${key}' of undefined.`)
        return false
    } else if (typeof key === 'number') {
        if (!(Array.isArray(value) || typeof value in ['object', 'string'])) {
            console.error(`Error: trying to access a number attribute on a \'${typeof value}\' value. It can be a array, a object or a string`)
            return false
        }
    } else if (typeof key === 'string') {
        if (typeof value !== 'object') {
            console.error(`Error: trying to access a string attribute on a \'${typeof value}\' value. It should be a object.`)
            return false
        }
    } else {
        console.error(`Error: trying to access an attribute using a \'${typeof key}\' key. It should be a number, a string or empty.`)
        return false
    }
    return true
}

export function getValueFromAttributePath(jsonObject, attributePath, filter = null) {
    try {
        const attributes = attributePath.split('.');
        let value = jsonObject;
        for (const [i, attribute] of Object.entries(attributes)) {
            if (/\[[^\]]*\]/.test(attribute)) {
                const [key, ...indexes] = attribute.split(/\[|\]/).filter((_, i) => i === 0 || i % 2 !== 0);
                if (key !== '') {
                    if (!checkKey(value, key)) return null
                    value = value[key];
                }

                for (const [j, index] of Object.entries(indexes)) {
                    if (index === '') {
                        if (!Array.isArray(value)) {
                            console.error('Error: trying to iterate over a valuer thats not an Array')
                            return null
                        }
                        const results = []
                        const newPath = [
                            indexes.slice(j+1).map(x => `[${x}]`).join(''),
                            attributes.slice(i+1)
                        ].flat().filter(Boolean).join('.')
                        // console.log({ newPath })
                        for (const v of value) {
                            if (newPath !== '') {
                                const r = getValueFromAttributePath(v, newPath, filter)
                                if (r === null) continue
                                results.push(r)
                            } else if (filter) {
                                const r = getValueFromAttributePath(v, filter.path, filter.value)
                                if (r === null) continue
                                results.push(v)
                            } else {
                                results.push(v)
                            }
                        }

                        return results
                    } else {
                        let key = JSON.parse(index)
                        if (!checkKey(value, key)) return null
                        value = value[key];
                    }
                }
            } else {
                if (!checkKey(value, attribute)) return null
                value = value[attribute];
            }
        }

        if (!filter)
            return value;
        else if (typeof filter === 'object')
            return getValueFromAttributePath(value, filter.path, filter.value) !== null ? value : null
        else if (filter !== null)
            return value === filter ? value : null;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// const jsonString = `{
//     "id": "0001",
//     "type": "donut",
//     "name": "Cake",
//     "ppu": 0.55,
//     "batters": {
//         "batter": [
//             { "id": "1001", "type": "Regular" },
//             { "id": "1002", "type": "Chocolate" },
//             { "id": "1003", "type": "Blueberry" },
//             { "id": "1004", "type": "Devil's Food" }
//         ]
//     },
//     "topping": [
//         { "id": "5001", "type": "None" },
//         { "id": "5002", "type": "Glazed" },
//         { "id": "5005", "type": "Sugar" },
//         { "id": "5007", "type": "Powdered Sugar" },
//         { "id": "5006", "type": "Chocolate with Sprinkles" },
//         { "id": "5003", "type": "Chocolate" },
//         { "id": "5004", "type": "Maple" }
//     ]
// }`;

// const jsonObject = JSON.parse(jsonString)
// const params = [jsonObject, "topping[].type"]
// console.log(params)
// console.log(getValueFromAttributePath(...params))