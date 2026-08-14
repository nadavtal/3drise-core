import type { ProjectData, UniformDefinition } from "./types";
export type AssetPayload = {
    name: string;
    type: AssetType;
    creatorId?: string;
    projectId?: string;
    description?: string;
    path?: string;
    price?: number;
    privacy?: Privacy;
    vertex?: string;
    fragment?: string;
    uniforms?: UniformDefinition[];
    settings?: any;
    url?: string;
    projects?: Partial<Project>[];
    fileSize?: number;
};

export type Asset = AssetPayload & {
    id: string;
    fileSize?: number;
};

export type UserDataType = "projects" | "assets" | "subscription" | "billing" | "usage" | "stats" | "support";

export interface User {
    id: string;
    userName: string;
    email: string;
    role?: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
    projects?: Project[];
    purchasedTransactions?: Transaction[];
    soldTransactions?: Transaction[];
    createdAssets?: Asset[];
    ownedAssets?: Asset[];
}

export interface UserData {
    projects: Project[];
    ownedAssets: Asset[];
    purchasedTransactions: Transaction[];
    soldTransactions: Transaction[];
    collections: Asset[];
}

export interface ProjectFork {
    id: string;
    sourceProjectId: string;
    sourceUserId: string;
    forkedProjectId: string;
    forkedByUserId: string;
    forkedAt: string;
    sourceProject?: {
        id: string;
        name: string;
        owner?: {
            id: string;
            userName: string;
        };
    };
}

export interface Project extends ProjectData {
    id: string;
    name: string;
    description?: string;
    userId: string;
    price?: number;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
    owner?: User;
    dependencies?: ProjectDependency[];
    dependentProjects?: ProjectDependency[];
    transactions?: Transaction[];
    assets?: Asset[];
    tags?: Tag[];
    type?: string;
    privacy?: Privacy;
    forkCount?: number;
    forkedFrom?: ProjectFork;
}

export interface ProjectDependency {
    id: string;
    projectId: string;
    dependentProjectId: string;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    dependentProject?: Project;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Transaction {
    id: string;
    projectId: string;
    buyerId: string;
    sellerId: string;
    price: number;
    status: TransactionStatus;
    transactionDate?: string;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    buyer?: User;
    seller?: User;
}

export interface ApiResponse<T> {
    success?: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers?: number;
        totalProjects?: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface UsersResponse extends PaginatedResponse<User> {
    users: User[];
}

export interface ProjectsResponse extends PaginatedResponse<Project> {
    projects: Project[];
}

export interface AssetsResponse {
    createdAssets: AssetWithCount[];
    ownedAssets: AssetWithCount[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalAssets: number;
        totalCreated: number;
        totalOwned: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface AssetWithCount extends Asset {
    projectCount: number;
}

export interface DependenciesResponse {
    dependencies: ProjectDependency[];
}

export interface CreateUserPayload {
    userName: string;
    email: string;
    password: string;
}

export interface UpdateUserPayload {
    id: string;
    userName?: string;
    email?: string;
    password?: string;
}

export interface GetUsersPayload {
    page?: number;
    limit?: number;
    search?: string;
    includeProjects?: boolean;
}

export interface GetUserPayload {
    id: string;
    includeData?: boolean;
}

export interface GetUserProjectsPayload {
    id: string;
    page?: number;
    limit?: number;
    status?: ProjectStatus;
    minimal?: boolean;
}

export interface GetUserAssetsPayload {
    id: string;
    page?: number;
    limit?: number;
    type?: AssetType;
    ownership?: 'all' | 'created' | 'owned';
}

export type ProjectBasicInfo = {
    name: string;
    description?: string;
    settings?: Record<string, any>;
    price?: number;
    status?: ProjectStatus;
    privacy?: Privacy;
};

export type UpdateProjectPayload = ProjectBasicInfo & {
    id: string;
};

export interface GetProjectsPayload {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProjectStatus;
    userId?: string;
    includeOwner?: boolean;
    includeDependencies?: boolean;
    includeScreenshots?: boolean;
    includeTags?: boolean;
    tags?: string;
    minPrice?: number;
    maxPrice?: number;
}

export interface GetProjectPayload {
    id: string;
}

export interface AddProjectDependencyPayload {
    projectId: string;
    dependentProjectId: string;
}

export interface RemoveProjectDependencyPayload {
    projectId: string;
    dependencyId: string;
}

export interface CopyProjectPayload {
    id: string;
    newName: string;
    copyAssets?: boolean;
    copyDependencies?: boolean;
}

export type ProjectDataType = 'sceneObjects' | 'environments' | 'lights' | 'camera' | 'project' | 'postProcessing' | 'sceneSettings' | 'animationSequences';

export interface CreateDataItem {
    data: Record<string, any>;
    order?: number;
    localOverrides?: Record<string, any>;
    tempId?: string;
}

export interface UpdateDataItem {
    id: string;
    data?: Record<string, any>;
    junctionData?: {
        order?: number;
        localOverrides?: Record<string, any>;
    };
}

export interface DeleteDataItem {
    id: string;
    unlinkOnly?: boolean;
}

export interface DataTypeUpdate {
    dataType: ProjectDataType;
    create?: CreateDataItem[];
    update?: UpdateDataItem[];
    delete?: DeleteDataItem[];
}

export interface BatchUpdatePayload {
    projectId: string;
    updates: DataTypeUpdate[];
}

export interface CreatedMapping {
    tempId: string;
    realId: string;
}

export interface BatchUpdateResultItem {
    dataType: ProjectDataType;
    created: CreatedMapping[];
    updated: string[];
    deleted: string[];
    unlinked: string[];
}

export interface BatchUpdateResponse {
    success: boolean;
    results: BatchUpdateResultItem[];
}

export interface UserThunkError {
    message: string;
}

export interface ProjectThunkError {
    message: string;
}

export interface UsersState {
    users: User[];
    currentUser: User | null;
    userProjects: Project[];
    loading: boolean;
    error: string | null;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | null;
}

export interface ProjectsState {
    projects: Project[];
    currentProject: Project | null;
    projectDependencies: ProjectDependency[];
    loading: boolean;
    error: string | null;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalProjects: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | null;
}


// Types for User management
export enum AssetType {
    MODEL = "model",
    TEXTURE = "texture",
    AUDIO = "audio",
    MATERIAL = "material",
    IMAGE = "image",
    UI_TEMPLATE = "ui_template",
    GALLERY = "gallery",
    HDR = "hdr",
    ANIMATION = "animation",
    ACTION = "action",
    PATH = "path",
    SCREENSHOT = "screenshot"
}
export enum Privacy {
    PUBLIC = "public",
    PRIVATE = "private"
}
export enum ProjectStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PUBLISHED = "published",
    DRAFT = "draft"
}
export enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
}
