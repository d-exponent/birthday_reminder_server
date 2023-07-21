module.exports = class QueryBuilder {
  constructor(mongooseQuery, reqQuery) {
    this.mongooseQuery = mongooseQuery
    this.reqQuery = reqQuery
  }

  page() {
    const page = this.reqQuery.page * 1 || 1
    const limit = this.reqQuery.limit * 1 || 200
    const skip = (page - 1) * limit

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit)
    return this
  }

  sort() {
    this.mongooseQuery.sort(
      this.reqQuery.sort ? this.reqQuery.sort.split(',').join(' ') : 'createdAt'
    )
    return this
  }

  filter() {
    const toRemove = ['page', 'sort', 'limit', 'feilds']
    toRemove.forEach(el => delete this.reqQuery[el])

    const queryStr = JSON.stringify(this.reqQuery)
    const query = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    this.mongooseQuery.find(JSON.parse(query))
    return this
  }

  fields() {
    this.mongooseQuery = this.mongooseQuery.select(
      this.reqQuery.feilds ? this.reqQuery.feilds.split(',').join(' ') : '-__v'
    )
    return this
  }
}
