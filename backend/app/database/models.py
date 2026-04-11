from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    prompt_hash = Column(String(16), index=True)
    provider = Column(String(32), index=True)
    model = Column(String(64))
    priority = Column(String(16))

    input_tokens = Column(Integer)
    output_tokens = Column(Integer)
    total_tokens = Column(Integer)

    cost_usd = Column(Float)
    credits = Column(Float)
    latency_ms = Column(Float)

    # Truncated response for logging purposes
    response_text = Column(Text)

    # Savings vs always using the baseline model
    baseline_cost_usd = Column(Float)
    savings_usd = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)
