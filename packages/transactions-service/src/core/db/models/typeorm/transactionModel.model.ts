import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from 'typeorm'
import type TransactionInterface from '../interfaces/transaction.interface'
import TransactionEntity from '../../../../app/entities/transaction.entity'
import { getTransactionStatusFromValue } from '../../../../app/entities/enums/transactionStatus.enum'
import { getTransactionTypeEnumFromValue } from '../../../../app/entities/enums/transactionType.enum'

@Entity({ name: 'transactions' })
class TransactionModel extends BaseEntity implements TransactionInterface {
  @PrimaryGeneratedColumn()
    id?: number

  @Column({ name: 'transaction_external_id', unique: true, type: 'text' })
    transaction_external_id?: string

  @Column({ name: 'value', type: 'float8' })
    value!: number

  @Column({ name: 'transaction_type', type: 'text' })
    transaction_type?: string

  @Column({ name: 'transaction_status', type: 'text' })
    transaction_status?: string

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at?: Date | undefined

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updated_at?: Date | undefined

  toDomain (): TransactionEntity {
    return new TransactionEntity(
      this.transaction_external_id ?? '',
      this.value,
      getTransactionTypeEnumFromValue(this.transaction_type),
      getTransactionStatusFromValue(this.transaction_status),
      this.created_at ?? new Date()
    )
  }

  public static fromDomain (entity: TransactionEntity): TransactionModel {
    const transactionModel = new TransactionModel()
    transactionModel.transaction_external_id = entity.transactionExternalId
    transactionModel.value = entity.value
    transactionModel.transaction_type = entity.transactionType.toString()
    transactionModel.transaction_status = entity?.transactionStatus?.toString()
    transactionModel.created_at = entity.createdAt ?? new Date()
    return transactionModel
  }
}
export default TransactionModel