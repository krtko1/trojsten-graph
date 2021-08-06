export type DateYMDString = string

export type Person = {
    id: number,
    firstName: string,
    lastName: string,
    maidenName: string,
    nickname: string,
    gender: Gender,
    birthDate?: DateYMDString,
    deathDate?: DateYMDString,
    memberships: Array<Membership>
}

export type Relationship = {
    id: number,
    source: number,
    target: number,
    statuses: Array<RelationshipStatus>
}

export type RelationshipStatus = {
    status: RelationshipStatusType,
    dateStart: DateYMDString,
    dateEnd: DateYMDString
}

export type Membership = {
    dateStarted: DateYMDString,
    dateEnded: DateYMDString,
    groupName: string,
    groupCategory: GroupCategory
}

export enum Gender {
    MALE = 1,
    FEMALE = 2,
    OTHER = 3
}

export enum GroupCategory {
    ELEMENTARY_SCHOOL = 1,
    HIGH_SCHOOL = 2,
    UNIVERSITY = 3,
    SEMINAR = 4,
    OTHER
}

export enum RelationshipStatusType {
    BLOOD_RELATIVE = 1,
    SIBLING = 2,
    PARENT_CHILD = 3,
    MARRIED = 4,
    ENGAGED = 5,
    DATING = 6,
    RUMOUR = 7
}
