import _ from 'lodash';
import type { ModelAnalysis } from "../types/scene3d";
import { Object3D } from "three";

export const isValidNumber = (val: string | number): boolean => {
    // console.log('val', val == "")
    let isValid = true;
    if (val === '-' || val === '' || isNaN(Number(val))) {
        isValid = false;
    }
    return isValid;
};
export const cleanObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object')
        return obj;
    const cleaned = {};
    Object.keys(obj).forEach(key => {
        // Skip properties that start with 'field'
        if (key.toLowerCase().startsWith('field')) {
            return;
        }
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('{')) {
            return;
        }
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
            value === undefined) {
            cleaned[key] = value;
        }
        // Skip arrays, objects, functions, etc.
    });
    return cleaned;
};
export const getLastCreateditem = (items: any[]): any => [...items].sort((a, b) => b.id - a.id)[0];
export const getFileNameByString = (str: string, items: any[]): any[] => items.filter(item => item.name.includes(str));
export const sortBy = (data: any[], field: string, reverse?: boolean): any[] => {
    const array = [...data];
    if (reverse) {
        array.sort((a, b) => a[field] < b[field] ? 1 : b[field] < a[field] ? -1 : 0);
    }
    else {
        array.sort((a, b) => a[field] > b[field] ? 1 : b[field] > a[field] ? -1 : 0);
    }
    //
    return array;
};
export const createSurveyTasksTree = (surveys: any[], bridgeTasks: any[]): any[] => {
    const tree = surveys
        // .filter((surv) => surv.id === displayedSurvey.id)
        .map((survey) => {
        const tasks = sortBy(bridgeTasks.filter((task) => task.survey_id === survey.id), 'task_order').map((task) => {
            return {
                ...task,
                children: task.sub_tasks.map((subTask) => ({
                    ...subTask,
                    parentTask: task,
                })),
            };
        });
        return {
            ...survey,
            children: tasks,
        };
    });
    return tree;
};
export const getAnnotationsByImageName = (imageName: string, annotations: any[]): any[] => {
    const newAnnotations = [];
    annotations.forEach(ann => ann.annotations &&
        ann.annotations.forEach((ann) => {
            const newAnnotation = { ...ann };
            newAnnotation.defect = ann;
            imageName.includes(ann.image_name) && newAnnotations.push(newAnnotation);
        }));
    return newAnnotations;
};
export function getDataByField(data: any[], field: string, value: string | number): any[] {
    return data.filter((el) => el[field] == value);
}
export const getUniqueValuesFromColumn = (field: string, data: any[]): any[] => {
    //
    const uniqueValues = [];
    data.map(row => {
        if (row &&
            row[field] &&
            row[field] !== '' &&
            !uniqueValues.includes(row[field]))
            uniqueValues.push(row[field]);
    });
    //
    return uniqueValues;
};
export const isNumber = (value: any): boolean => typeof value === 'number' || (!isNaN(Number(value)) && value !== null && value !== '') || value === Infinity || value === -Infinity;
export function isDateValue(value: any): boolean {
    if (value instanceof Date && !isNaN(value.getTime()))
        return true;
    // Check if it's a string that can be parsed to a valid date
    if (typeof value === 'string') {
        // First, check if it looks like a date format
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
            /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
            /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/DD/YYYY
            /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-M-D or YYYY-MM-DD
            /^\w{3}\s+\d{1,2},?\s+\d{4}$/, // Mon DD, YYYY or Mon DD YYYY
            /^\d{1,2}\s+\w{3}\s+\d{4}$/, // DD Mon YYYY
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ // ISO format
        ];
        // Check if the string matches common date patterns
        const looksLikeDate = datePatterns.some(pattern => pattern.test(value.trim()));
        if (!looksLikeDate) {
            return false;
        }
        // If it looks like a date, then try to parse it
        const d = new Date(value);
        return !isNaN(d.getTime());
    }
    return false;
}
export function parseJsonWithFixedControlChars(jsonString: string): any {
    // Check for bad control characters
    if (/[\u0000-\u001f]/.test(jsonString)) {
        // Replace bad control characters with their escaped equivalents
        jsonString = jsonString.replace(/[\u0000-\u001f]/g, function (match) {
            return `\\u${(`0000${match.charCodeAt(0).toString(16)}`).slice(-4)}`;
        });
    }
    return JSON.parse(jsonString);
}
export const fixAndParseJson = (jsonString: string): any => {
    try {
        // console.log("fixAndParseJson", jsonString);
        console.log(/[\u0000-\u001f]/.test(jsonString));
        if (/[\u0000-\u001f]/.test(jsonString)) {
            // Replace bad control characters with their escaped equivalents
            jsonString = jsonString.replace(/[\u0000-\u001f]/g, function (match) {
                return `\\u${(`0000${match.charCodeAt(0).toString(16)}`).slice(-4)}`;
            });
            return JSON.parse(jsonString);
        }
        else {
            for (let i = 0; i < jsonString.length; i++) {
                if (jsonString.charCodeAt(i) < 32) {
                    // Replace bad control characters with their escaped equivalents
                    jsonString = jsonString.replace(/[\u0000-\u001f]/g, function (match) {
                        return `\\u${(`0000${match.charCodeAt(0).toString(16)}`).slice(-4)}`;
                    });
                    break;
                }
            }
            // If no bad control characters are found, parse the JSON string directly
            return JSON.parse(jsonString);
        }
    }
    catch (e) {
        console.error("Error fixing JSON string:", e);
        // If there's an error, return the original string or handle it as needed
        return null;
    }
};
export function onlyUnique(value: any, index: number, self: any[]): boolean {
    return self.indexOf(value) === index;
}
export const getUniqueByField = <T>(field: string, data: T[]): T[] => {
    const uniqueValues = [];
    const returnedData = [];
    data.forEach((item) => {
        if (item && item[field] && !uniqueValues.includes(item[field])) {
            uniqueValues.push(item[field]);
            returnedData.push(item);
        }
    });
    return returnedData;
};
export const sortByFields = (fields: string[], data: any[]): any[] => _.cloneDeep(data).sort(function (a, b) {
    // Sort by name
    fields.forEach(field => {
        if (a[field] < b[field])
            return -1;
        if (a[field] > b[field])
            return 1;
    });
    return 0; // names, age and city are equal
});
export const getMinOfField = (fieldName: string, data: any[]): any => {
    let min = data[0][fieldName];
    data.forEach(element => {
        if (element[fieldName] < min)
            min = element[fieldName];
    });
    return min;
};
export const getMaxOfField = (fieldName: string, data: any[]): any => {
    let max = data[0][fieldName];
    data.forEach(element => {
        if (element[fieldName] > max)
            max = element[fieldName];
    });
    return max;
};
export const getSumOfField = (fieldName: string, data: any[]): number => {
    let sum = 0;
    data.forEach(element => {
        sum += element[fieldName];
    });
    return sum;
};
export const calculateBridgeScs = (spans: any[]): number => {
    let scs = 0;
    //
    const sumSpansArea = getSumOfField('span_area', spans);
    //
    spans.forEach(span => {
        scs += span.SCS * (span.span_area / sumSpansArea);
    });
    return scs;
};
export const calculateBridgeCpi = (spans: any[]): number => {
    let cpi = 0;
    const sumSpansArea = getSumOfField('span_area', spans);
    spans.forEach(span => {
        cpi += span.CPI * (span.span_area / sumSpansArea);
    });
    return cpi;
};
export const getSeveritiesFromElementDefectRating = (defectRating: any, severities: any[], imageAnnotations: any[]): any[] => Object.keys(defectRating)
    .map(defectCode => {
    // console.log(defectRating[defectCode]);
    if (defectRating[defectCode] &&
        defectRating[defectCode].severity &&
        defectRating[defectCode].severity.length) {
        return defectRating[defectCode].severity;
    }
    const heighest = getHighesSeverityFromAnnotations(imageAnnotations.filter(ann => ann.defect_code == defectCode), severities);
    return heighest && heighest.description;
})
    .map(sev => severities.find(severity => severity.description == sev));
export const getExtentsFromElementDefectRating = (defectRating: any, extents: any[]): any[] => Object.keys(defectRating)
    .map(defectCode => defectRating[defectCode].extent)
    .map(ext => extents.find(extent => extent.description == ext));
export const getHighesSeverityFromAnnotations = (annotations: any[], severities: any[]): any => {
    const annotationsSeveritis = annotations.map(ann => severities.find(severity => ann.severity == severity.description));
    const uniqueSeverities = getUniqueValuesFromColumn('severity', annotationsSeveritis).sort();
    const highestSeverity = severities.find(sev => sev.severity == uniqueSeverities[uniqueSeverities.length - 1]);
    return highestSeverity;
};
export const getFileNameFromDirectoryPath = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1];
};
export const getFolderAndFileName = (path: string): {
        folder: string;
        fileName: string;
    } => {
    let folder = '';
    let fileName = '';
    if (path) {
        const parts = path.split('Images/');
        folder = parts[1];
        fileName = folder.split('/').pop() || '';
        folder = folder.replace(fileName, '');
    }
    return { folder, fileName };
};
export const extractJsonFromText = (text: string): any[] => {
    if (!text)
        return [];
    const jsonResults = [];
    try {
        const fullJson = JSON.parse(text.trim());
        jsonResults.push(fullJson);
        return jsonResults;
    }
    catch {
        // Continue to other methods
    }
    // Extract JSON from markdown code blocks
    const codeBlockRegex = /```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```/gi;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        try {
            const jsonContent = match[1].trim();
            const parsed = JSON.parse(jsonContent);
            jsonResults.push(parsed);
        }
        catch (error) {
            console.warn("Failed to parse JSON from code block:", error);
        }
    }
    // Extract JSON objects/arrays using regex
    const jsonRegex = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g;
    let jsonMatch;
    while ((jsonMatch = jsonRegex.exec(text)) !== null) {
        try {
            const jsonString = jsonMatch[1];
            if (jsonString.includes(':') || jsonString.includes('[')) {
                const parsed = JSON.parse(jsonString);
                if (!jsonResults.some(existing => JSON.stringify(existing) === JSON.stringify(parsed))) {
                    jsonResults.push(parsed);
                }
            }
        }
        catch (error) {
            // Skip invalid JSON
        }
    }
    return jsonResults;
};
export const analyzeModel = (model: any): ModelAnalysis => {
    const modelAnalysis = {
        interactibles: [],
        meshes: 0,
        materials: 0,
        textures: 0,
        unNamedMeshes: 0,
    };
    // console.log("analyzeModel model:", model);
    model.traverse((child) => {
        if (child.isMesh) {
            modelAnalysis.meshes++;
            if (child.name && child.name !== "" && !child.name.toLowerCase().includes('mesh')) {
                child.userData = {
                    ...child.userData,
                    interactible: true,
                };
                modelAnalysis.interactibles.push(child);
                // console.log("Setting interactible for mesh:", child.name);
            }
            else {
                modelAnalysis.unNamedMeshes++;
            }
        }
    });
    return modelAnalysis;
};
export const processModel = (model: Object3D): ModelAnalysis => {
    const modelAnalysis = {
        interactibles: [],
        meshes: 0,
        materials: 0,
        textures: 0,
        unNamedMeshes: 0,
    };
    console.log("Processing model:", model);
    model.traverse((child) => {
        if ((child as any).isMesh) {
            modelAnalysis.meshes++;
            if (!child.name.toLowerCase().includes('mesh')) {
                child.userData = {
                    interactible: true,
                };
                modelAnalysis.interactibles.push(child);
                // console.log("Setting interactible for mesh:", child.name);
            }
            else {
                modelAnalysis.unNamedMeshes++;
            }
        }
    });
    return modelAnalysis;
};
export const getType = (property: string, value: any): any => {
    const isVector3 = (value) => {
        return Array.isArray(value) && value.length === 3;
    };
    const isAnchor = (value) => {
        return property.toLowerCase().includes('anchor');
    };
    const isVector2 = (value) => {
        return Array.isArray(value) && value.length === 2;
    };
    const isVector4 = (value) => {
        return Array.isArray(value) && value.length === 4;
    };
    const isShape = () => {
        return property.toLowerCase().includes('shape');
        // && property.toLowerCase().includes('type');
    };
    const isFont = () => {
        return property === 'font';
        // && property.toLowerCase().includes('type');
    };
    const isRenderMode = () => {
        return property === 'renderMode';
    };
    const isGeometry = () => {
        return property.toLowerCase().includes('geometry');
        // && property.toLowerCase().includes('type');
    };
    const isLayout = () => {
        return property.toLowerCase() === 'layout';
        // && property.toLowerCase().includes('type');
    };
    const isHexColor = (value) => {
        if (typeof value === "string") {
            // Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA
            const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
            return hexRegex.test(value);
        }
        return false;
    };
    const isAnimation = () => property === "animationId";
    const isSide = () => property === "side";
    const isAxis = () => property === "axis";
    const isColorProperty = () => property.toLowerCase().includes("color");
    const isTexture = (prop) => {
        const lower = prop.toLowerCase();
        return lower.includes("texture") || lower === "map" || lower.endsWith("map");
    };
    const iseNoise = (prop) => {
        const lower = prop.toLowerCase();
        return lower.includes("noise") && !lower.includes("texture");
    };
    if (typeof value === "boolean") {
        return "checkbox";
    }
    if (isAnchor(value)) {
        return "anchor";
    }
    if (isRenderMode()) {
        return "renderMode";
    }
    if (isLayout()) {
        return "layout";
    }
    if (isShape()) {
        return "shapeType";
    }
    if (isGeometry()) {
        return "geometryType";
    }
    if (isFont()) {
        return "font";
    }
    if (isHexColor(value) || isColorProperty()) {
        return "color";
    }
    if (isVector3(value)) {
        return "vector3";
    }
    if (isVector2(value)) {
        return "vector2";
    }
    if (isVector4(value)) {
        return "vector4";
    }
    if (isTexture(property)) {
        return "texture";
    }
    if (iseNoise(property)) {
        return "noise";
    }
    if (isSide()) {
        return "side";
    }
    if (isAxis()) {
        return "axis";
    }
    if (property === 'ease') {
        return "ease";
    }
    if (isAnimation()) {
        return "animation";
    }
    // if (property.includes("scale") || property.includes("Scale")) {
    //   return "vector3";
    // }
    // if (property.includes("rotation") || property.includes("Rotation")) {
    //   return "vector3";
    // }
    return typeof value;
};
